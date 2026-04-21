import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import { useListings, ListingItem } from '@/contexts/ListingsContext';
import { useI18n } from '@/contexts/I18nContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { MapPin, Loader2, LocateFixed, Search } from 'lucide-react';

// Fix default marker icons (CDN-served)
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

// Cache geocoded locations in localStorage
const GEO_CACHE_KEY = 'nearby_geo_cache_v1';
const loadGeoCache = (): Record<string, [number, number]> => {
  try { return JSON.parse(localStorage.getItem(GEO_CACHE_KEY) || '{}'); } catch { return {}; }
};
const saveGeoCache = (c: Record<string, [number, number]>) => {
  try { localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(c)); } catch { /* noop */ }
};

async function geocode(text: string): Promise<[number, number] | null> {
  if (!text) return null;
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(text)}`, {
      headers: { 'Accept-Language': 'ar,en' },
    });
    const arr = await res.json();
    if (Array.isArray(arr) && arr[0]) return [parseFloat(arr[0].lat), parseFloat(arr[0].lon)];
  } catch { /* noop */ }
  return null;
}

function haversine(a: [number, number], b: [number, number]) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function FlyTo({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.flyTo(center, 12, { duration: 0.8 }); }, [center, map]);
  return null;
}

export default function NearbyPage() {
  const { t, isRtl } = useI18n();
  const { items } = useListings();
  const [center, setCenter] = useState<[number, number]>([24.7136, 46.6753]); // Riyadh default
  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
  const [radiusKm, setRadiusKm] = useState(50);
  const [search, setSearch] = useState('');
  const [geocoding, setGeocoding] = useState(true);
  const [coords, setCoords] = useState<Record<string, [number, number]>>({});
  const [locating, setLocating] = useState(false);

  // Geocode all items that lack coordinates
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setGeocoding(true);
      const cache = loadGeoCache();
      const result: Record<string, [number, number]> = {};
      for (const it of items) {
        if (it.latitude != null && it.longitude != null) {
          result[it.id] = [it.latitude, it.longitude];
          continue;
        }
        if (!it.location) continue;
        if (cache[it.location]) {
          result[it.id] = cache[it.location];
          continue;
        }
        const c = await geocode(it.location);
        if (c) {
          cache[it.location] = c;
          result[it.id] = c;
          saveGeoCache(cache);
          // Be polite to Nominatim
          await new Promise((r) => setTimeout(r, 1100));
        }
        if (cancelled) return;
      }
      if (!cancelled) {
        setCoords(result);
        setGeocoding(false);
      }
    })();
    return () => { cancelled = true; };
  }, [items]);

  const requestLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLoc(c);
        setCenter(c);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => { requestLocation(); }, []);

  const handleSearchCity = async () => {
    if (!search.trim()) return;
    const c = await geocode(search);
    if (c) setCenter(c);
  };

  const itemsWithCoords = useMemo(() => {
    return items
      .filter((it) => coords[it.id])
      .map((it) => {
        const c = coords[it.id];
        const distance = userLoc ? haversine(userLoc, c) : haversine(center, c);
        return { item: it, coord: c, distance };
      })
      .filter((x) => x.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);
  }, [items, coords, userLoc, center, radiusKm]);

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2">
          <MapPin className="h-6 w-6 text-primary" />{t('nearby.title')}
        </h1>
        <p className="text-sm text-muted-foreground">{t('nearby.subtitle')}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3 h-[calc(100vh-14rem)]">
        {/* Left: Filters + List */}
        <Card className="flex flex-col h-full overflow-hidden lg:order-1 order-2">
          <div className="p-4 border-b space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder={t('nearby.searchCity')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchCity()}
              />
              <Button size="icon" onClick={handleSearchCity}><Search className="h-4 w-4" /></Button>
            </div>
            <Button variant="outline" size="sm" className="w-full gap-2" onClick={requestLocation} disabled={locating}>
              {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
              {t('nearby.useMyLocation')}
            </Button>
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-muted-foreground">{t('nearby.radius')}</span>
                <span className="font-semibold">{radiusKm} km</span>
              </div>
              <Slider value={[radiusKm]} onValueChange={(v) => setRadiusKm(v[0])} min={5} max={500} step={5} />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {geocoding && (
              <div className="flex items-center justify-center p-8 gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />{t('nearby.locating')}
              </div>
            )}
            {!geocoding && itemsWithCoords.length === 0 && (
              <div className="text-center p-8 text-sm text-muted-foreground">{t('nearby.noResults')}</div>
            )}
            <div className="space-y-2">
              {itemsWithCoords.map(({ item, coord, distance }) => (
                <button
                  key={item.id}
                  onClick={() => setCenter(coord)}
                  className="w-full text-start flex gap-3 p-2 rounded-xl hover:bg-muted transition-colors"
                >
                  <img src={item.images[0]} alt="" className="h-16 w-16 rounded-lg object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.location}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-primary font-bold">${item.price_per_day}/{t('details.day')}</span>
                      <Badge variant="secondary" className="text-[10px]">{distance.toFixed(1)} km</Badge>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Right: Map */}
        <div className="lg:col-span-2 lg:order-2 order-1 rounded-xl overflow-hidden border bg-muted min-h-[400px]">
          <MapContainer center={center} zoom={12} className="h-full w-full" style={{ minHeight: 400 }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{y}/{x}.png"
            />
            <FlyTo center={center} />
            {userLoc && (
              <>
                <Circle center={userLoc} radius={radiusKm * 1000} pathOptions={{ color: 'hsl(var(--primary))', weight: 1, fillOpacity: 0.05 }} />
                <Marker position={userLoc}>
                  <Popup>{t('nearby.youAreHere')}</Popup>
                </Marker>
              </>
            )}
            {itemsWithCoords.map(({ item, coord, distance }) => (
              <Marker key={item.id} position={coord}>
                <Popup minWidth={220}>
                  <div className="space-y-2">
                    <img src={item.images[0]} alt="" className="h-24 w-full rounded object-cover" />
                    <p className="font-semibold text-sm leading-tight">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.location} · {distance.toFixed(1)} km</p>
                    <p className="text-sm font-bold" style={{ color: 'hsl(var(--primary))' }}>${item.price_per_day}/{t('details.day')}</p>
                    <Button size="sm" className="w-full" asChild>
                      <Link to={`/items/${item.id}`}>{t('nearby.viewListing')}</Link>
                    </Button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
