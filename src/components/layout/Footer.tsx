import { Link } from 'react-router-dom';
import { useI18n } from '@/contexts/I18nContext';

export default function Footer() {
  const { t } = useI18n();

  return (
    <footer className="border-t bg-card">
      <div className="container py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-xs font-bold text-primary-foreground">RR</span>
              </div>
              <span className="font-display text-lg font-bold">Rent Right</span>
            </div>
            <p className="text-sm text-muted-foreground">{t('footer.tagline')}</p>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold mb-3">{t('footer.explore')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/browse" className="hover:text-foreground transition-colors">{t('footer.browseItems')}</Link></li>
              <li><Link to="/browse?category=Tools+%26+Equipment" className="hover:text-foreground transition-colors">{t('footer.tools')}</Link></li>
              <li><Link to="/browse?category=Outdoor+%26+Garden" className="hover:text-foreground transition-colors">{t('footer.outdoor')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold mb-3">{t('footer.company')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><span className="cursor-default">{t('footer.about')}</span></li>
              <li><span className="cursor-default">{t('footer.trust')}</span></li>
              <li><span className="cursor-default">{t('footer.help')}</span></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold mb-3">{t('footer.legal')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><span className="cursor-default">{t('footer.terms')}</span></li>
              <li><span className="cursor-default">{t('footer.privacy')}</span></li>
              <li><span className="cursor-default">{t('footer.insurancePolicy')}</span></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t pt-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Rent Right. {t('footer.rights')}
        </div>
      </div>
    </footer>
  );
}
