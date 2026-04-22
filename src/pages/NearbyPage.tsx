import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useListings, ListingItem } from '@/contexts/ListingsContext';
import { useI18n } from '@/contexts/I18nContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Loader2, LocateFixed, Search } from 'lucide-react';

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

const GEO_CACHE_KEY = 'nearby_geo_cache_v1';

const loadGeoCache = (): Record<string, [number, number]> => {
  try {
    return JSON.parse(localStorage.getItem(GEO_CACHE_KEY) || '{}');
  } catch {
    return {};
  }
};

const saveGeoCache = (cache: Record<string, [number, number]>) => {
  try {
    localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // noop
  }
};

// Try to extract "(lat, lng)" embedded in a free-text location.
function extractCoordsFromText(text: string): [number, number] | null {
  if (!text) return null;
  const m = text.match(/(-?\d{1,3}\.\d+)[\s,،]+(-?\d{1,3}\.\d+)/);
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lng = parseFloat(m[2]);
  if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
    return [lat, lng];
  }
  return null;
}

async function geocode(text: string): Promise<[number, number] | null> {
  if (!text) return null;

  const embedded = extractCoordsFromText(text);
  if (embedded) return embedded;

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(text)}`, {
      headers: { 'Accept-Language': 'ar,en' },
    });
    const arr = await res.json();
    if (Array.isArray(arr) && arr[0]) return [parseFloat(arr[0].lat), parseFloat(arr[0].lon)];
  } catch {
    // noop
  }

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

function getThemeColor(variableName: string, fallback: string) {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
  return value ? `hsl(${value})` : fallback;
}

function buildPopupContent({
  item,
  distance,
  dayLabel,
  viewLabel,
  primaryColor,
}: {
  item: ListingItem;
  distance: number;
  dayLabel: string;
  viewLabel: string;
  primaryColor: string;
}) {
  const wrapper = document.createElement('div');
  wrapper.style.display = 'grid';
  wrapper.style.gap = '8px';
  wrapper.style.minWidth = '220px';

  const image = document.createElement('img');
  image.src = item.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=400&fit=crop';
  image.alt = item.title;
  image.style.width = '100%';
  image.style.height = '96px';
  image.style.objectFit = 'cover';
  image.style.borderRadius = '6px';

  const title = document.createElement('p');
  title.textContent = item.title;
  title.style.margin = '0';
  title.style.fontSize = '14px';
  title.style.fontWeight = '600';
  title.style.lineHeight = '1.35';

  const meta = document.createElement('p');
  meta.textContent = `${item.location} · ${distance.toFixed(1)} km`;
  meta.style.margin = '0';
  meta.style.fontSize = '12px';
  meta.style.color = '#6b7280';

  const price = document.createElement('p');
  price.textContent = `$${item.price_per_day}/${dayLabel}`;
  price.style.margin = '0';
  price.style.fontSize = '14px';
  price.style.fontWeight = '700';
  price.style.color = primaryColor;

  const cta = document.createElement('a');
  cta.href = `/items/${item.id}`;
  cta.textContent = viewLabel;
  cta.style.display = 'inline-flex';
  cta.style.alignItems = 'center';
  cta.style.justifyContent = 'center';
  cta.style.width = '100%';
  cta.style.height = '36px';
  cta.style.borderRadius = '8px';
  cta.style.background = primaryColor;
  cta.style.color = '#ffffff';
  cta.style.textDecoration = 'none';
  cta.style.fontSize = '13px';
  cta.style.fontWeight = '600';

  wrapper.append(image, title, meta, price, cta);
  return wrapper;
}

export default function NearbyPage() {
  const { t } = useI18n();
  const { items } = useListings();
  const [center, setCenter] = useState<[number, number]>([24.7136, 46.6753]);
  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
  const [radiusKm, setRadiusKm] = useState(50);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [geocoding, setGeocoding] = useState(true);
  const [coords, setCoords] = useState<Record<string, [number, number]>>({});
  const [locating, setLocating] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const overlaysLayerRef = useRef<L.LayerGroup | null>(null);
  const markerRefs = useRef<Record<string, L.Marker>>({});

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

        const locationCoords = await geocode(it.location);
        if (locationCoords) {
          cache[it.location] = locationCoords;
          result[it.id] = locationCoords;
          saveGeoCache(cache);
          await new Promise((resolve) => setTimeout(resolve, 1100));
        }

        if (cancelled) return;
      }

      if (!cancelled) {
        setCoords(result);
        setGeocoding(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [items]);

  const requestLocation = () => {
    if (!navigator.geolocation) return;

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nextCenter: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLoc(nextCenter);
        setCenter(nextCenter);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    requestLocation();
  }, []);

  const handleSearchCity = async () => {
    if (!search.trim()) return;
    const locationCoords = await geocode(search);
    if (locationCoords) setCenter(locationCoords);
  };

  const categories = useMemo(() => {
    return Array.from(new Set(items.map((i) => i.category).filter(Boolean))).sort();
  }, [items]);

  const itemsWithCoords = useMemo(() => {
    return items
      .filter((item) => coords[item.id])
      .filter((item) => category === 'all' || item.category === category)
      .map((item) => {
        const coord = coords[item.id];
        const distance = userLoc ? haversine(userLoc, coord) : haversine(center, coord);
        return { item, coord, distance };
      })
      .filter((entry) => entry.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);
  }, [items, coords, userLoc, center, radiusKm, category]);

  useEffect(() => {
    if (!mapElementRef.current || mapRef.current) return;

    const map = L.map(mapElementRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView(center, 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    overlaysLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    requestAnimationFrame(() => map.invalidateSize());

    return () => {
      markerRefs.current = {};
      markersLayerRef.current = null;
      overlaysLayerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [center]);

  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.flyTo(center, 12, { duration: 0.8 });
  }, [center]);

  useEffect(() => {
    const map = mapRef.current;
    const markersLayer = markersLayerRef.current;
    const overlaysLayer = overlaysLayerRef.current;

    if (!map || !markersLayer || !overlaysLayer) return;

    const primaryColor = getThemeColor('--primary', '#2563eb');

    markersLayer.clearLayers();
    overlaysLayer.clearLayers();
    markerRefs.current = {};

    if (userLoc) {
      L.circle(userLoc, {
        radius: radiusKm * 1000,
        color: primaryColor,
        weight: 1,
        fillColor: primaryColor,
        fillOpacity: 0.05,
      }).addTo(overlaysLayer);

      L.marker(userLoc, { title: t('nearby.youAreHere') })
        .bindPopup(t('nearby.youAreHere'))
        .addTo(overlaysLayer);
    }

    itemsWithCoords.forEach(({ item, coord, distance }) => {
      const fallbackImg = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120&h=120&fit=crop';
      const img = (item.images && item.images[0]) || fallbackImg;
      const isSelected = selectedItemId === item.id;
      const html = `
        <div class="nearby-pin ${isSelected ? 'is-selected' : ''}" style="--pin-color:${primaryColor}">
          <div class="nearby-pin__bubble">
            <img src="${img}" alt="" />
            <span class="nearby-pin__price">$${item.price_per_day}</span>
          </div>
          <div class="nearby-pin__tail"></div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'nearby-pin-wrapper',
        html,
        iconSize: [56, 72],
        iconAnchor: [28, 70],
        popupAnchor: [0, -64],
      });

      const marker = L.marker(coord, { icon, title: item.title, riseOnHover: true });
      marker.bindPopup(
        buildPopupContent({
          item,
          distance,
          dayLabel: t('details.day'),
          viewLabel: t('nearby.viewListing'),
          primaryColor,
        }),
        { minWidth: 220 }
      );

      marker.on('click', () => setSelectedItemId(item.id));
      marker.addTo(markersLayer);
      markerRefs.current[item.id] = marker;
    });

    requestAnimationFrame(() => map.invalidateSize());
  }, [itemsWithCoords, radiusKm, t, userLoc, selectedItemId]);

  useEffect(() => {
    if (!selectedItemId) return;
    const marker = markerRefs.current[selectedItemId];
    if (marker) marker.openPopup();
  }, [selectedItemId, itemsWithCoords]);

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2">
          <MapPin className="h-6 w-6 text-primary" />
          {t('nearby.title')}
        </h1>
        <p className="text-sm text-muted-foreground">{t('nearby.subtitle')}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3 lg:h-[calc(100vh-14rem)]">
        <Card className="flex flex-col overflow-hidden lg:order-1 order-2 lg:h-full max-h-[60vh] lg:max-h-none">
          <div className="p-4 border-b space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder={t('nearby.searchCity')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchCity()}
              />
              <Button size="icon" onClick={handleSearchCity}>
                <Search className="h-4 w-4" />
              </Button>
            </div>

            <Button variant="outline" size="sm" className="w-full gap-2" onClick={requestLocation} disabled={locating}>
              {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
              {t('nearby.useMyLocation')}
            </Button>

            <div>
              <label className="text-xs text-muted-foreground mb-2 block">{t('nearby.category')}</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('nearby.allCategories')}</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>{t(`cat.${c}`) !== `cat.${c}` ? t(`cat.${c}`) : c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-muted-foreground">{t('nearby.radius')}</span>
                <span className="font-semibold">{radiusKm} km</span>
              </div>
              <Slider value={[radiusKm]} onValueChange={(value) => setRadiusKm(value[0])} min={5} max={500} step={5} />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {geocoding && (
              <div className="flex items-center justify-center p-8 gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('nearby.locating')}
              </div>
            )}

            {!geocoding && itemsWithCoords.length === 0 && (
              <div className="text-center p-8 text-sm text-muted-foreground">{t('nearby.noResults')}</div>
            )}

            <div className="space-y-2">
              {itemsWithCoords.map(({ item, coord, distance }) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedItemId(item.id);
                    setCenter(coord);
                  }}
                  className="w-full text-start flex gap-3 p-2 rounded-xl hover:bg-muted transition-colors"
                >
                  <img src={item.images[0]} alt={item.title} className="h-16 w-16 rounded-lg object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.location}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-primary font-bold">${item.price_per_day}/{t('details.day')}</span>
                      <Badge variant="secondary" className="text-[10px]">
                        {distance.toFixed(1)} km
                      </Badge>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </Card>

        <div className="lg:col-span-2 lg:order-2 order-1 rounded-xl overflow-hidden border bg-muted h-[55vh] lg:h-full min-h-[320px]">
          <div ref={mapElementRef} className="h-full w-full" />
        </div>
      </div>
    </div>
  );
}
