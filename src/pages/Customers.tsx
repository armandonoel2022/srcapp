import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { LandingSidebar } from "@/components/LandingSidebar";
import { SettingsMenu } from "@/components/SettingsMenu";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import { Home } from "lucide-react";
import { useState } from "react";

const clientLogos = [
  {
    src: "/lovable-uploads/86a47fcd-5dd5-4de9-83c5-e0d6219bc278.png",
    alt: "Unión Europea - Delegación en República Dominicana"
  },
  {
    src: "/lovable-uploads/03619d85-decf-4bc7-900e-0a03326c0f7d.png", 
    alt: "Embajada de Alemania en Santo Domingo"
  },
  {
    src: "/lovable-uploads/6bdc10b1-554f-4455-9b25-c6e005da197e.png",
    alt: "República Francesa"
  },
  {
    src: "/lovable-uploads/ccf2ed77-93cc-45c0-a71c-6a456e204077.png",
    alt: "Reino de los Países Bajos"
  },
  {
    src: "/lovable-uploads/0eb22463-78c0-4036-9ea2-44712fa6e09f.png",
    alt: "Alianza Francesa"
  },
  {
    src: "/lovable-uploads/af9f20ab-1742-45b3-a624-cef5e4398ba7.png",
    alt: "European Investment Bank"
  }
];

export const Customers = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [showMore, setShowMore] = useState(false);

  const displayedClients = showMore ? clientLogos : clientLogos.slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="w-full bg-primary text-primary-foreground sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <LandingSidebar />
              <div className="text-lg md:text-xl font-bold">
                {t('header.title')}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <LanguageToggle />
              <SettingsMenu />
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/')}
                className="mr-2"
              >
                <Home className="h-4 w-4 mr-2" />
                {t('nav.home')}
              </Button>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => navigate('/auth')}
              >
                {t('header.accessControl')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-[30vh] overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(/lovable-uploads/d39f0302-dbf2-4a41-8258-65c43ff877fd.png)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-black/40">
            <div className="container mx-auto px-4 h-full flex items-center justify-center">
              <div className="text-center text-white">
                <h1 className="text-3xl md:text-5xl font-bold">
                  {t('clients.title')}
                </h1>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clients Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">
            {t('clients.title')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {displayedClients.map((client, index) => (
              <Card key={index} className="overflow-hidden bg-white p-6 flex items-center justify-center min-h-[200px] hover:shadow-lg transition-shadow duration-300">
                <img 
                  src={client.src}
                  alt={client.alt}
                  className="w-full h-auto object-contain max-h-[150px]"
                />
              </Card>
            ))}
          </div>
          
          <div className="text-center space-y-4">
            {!showMore && clientLogos.length > 3 && (
              <Button 
                variant="outline" 
                size="lg" 
                onClick={() => setShowMore(true)}
              >
                {t('clients.seeMore')}
              </Button>
            )}
            
            <div>
              <Button 
                variant="default" 
                size="lg" 
                onClick={() => navigate('/')}
              >
                <Home className="h-4 w-4 mr-2" />
                {t('nav.home')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card text-card-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">{t('footer.quickLinks')}</h3>
              <ul className="space-y-2">
                <li><a href="/" className="text-muted-foreground hover:text-foreground transition-colors">{t('nav.home')}</a></li>
                <li><a href="/about" className="text-muted-foreground hover:text-foreground transition-colors">{t('nav.about')}</a></li>
                <li><a href="/customers" className="text-muted-foreground hover:text-foreground transition-colors">{t('nav.customers')}</a></li>
                <li><a href="/#servicios" className="text-muted-foreground hover:text-foreground transition-colors">{t('nav.services')}</a></li>
              </ul>
            </div>

            {/* Additional Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">{t('footer.additionalLinks')}</h3>
              <ul className="space-y-2">
                <li><a href="mailto:contacto@src.com.do" className="text-muted-foreground hover:text-foreground transition-colors">{t('footer.leaveMessage')}</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">{t('footer.privacy')}</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">{t('footer.terms')}</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-lg font-semibold mb-4">{t('footer.contact')}</h3>
              <ul className="space-y-2">
                <li className="flex items-center space-x-2">
                  <span className="text-muted-foreground">809-732-5905</span>
                </li>
                <li className="flex items-center space-x-2">
                  <a href="https://wa.me/8098701062" className="text-muted-foreground hover:text-foreground transition-colors">809-870-1062</a>
                </li>
                <li className="flex items-center space-x-2">
                  <a href="mailto:contacto@src.com.do" className="text-muted-foreground hover:text-foreground transition-colors">contacto@src.com.do</a>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-muted-foreground text-sm">C/ Luis F. Thomen No. 255, Evaristo Morales, Sto. Dgo. R.D.</span>
                </li>
              </ul>
            </div>

            {/* Social Media */}
            <div>
              <h3 className="text-lg font-semibold mb-4">{t('footer.followUs')}</h3>
              <ul className="space-y-2">
                <li><a href="https://www.facebook.com/seguridadsrc/" className="text-muted-foreground hover:text-foreground transition-colors">Facebook</a></li>
                <li><a href="https://twitter.com/SRCseguridadRD" className="text-muted-foreground hover:text-foreground transition-colors">Twitter</a></li>
                <li><a href="https://instagram.com/srcseguridadrd" className="text-muted-foreground hover:text-foreground transition-colors">Instagram</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">LinkedIn</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border mt-8 pt-8 text-center">
            <p className="text-muted-foreground">
              {t('footer.madeBy')} <span className="text-foreground font-semibold">Armando Noel Diseñador Web</span> | {t('footer.rights')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};