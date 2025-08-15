import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { LandingSidebar } from "@/components/LandingSidebar";
import { SettingsMenu } from "@/components/SettingsMenu";
import { 
  Shield, 
  Camera, 
  Monitor, 
  Users, 
  AlertTriangle, 
  MapPin,
  Phone,
  Mail,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";

const getServices = (t: (key: string) => string) => [
  {
    titleKey: "services.security.title",
    icon: Shield,
    descriptionKey: "services.security.description",
    image: "/images/icon-1.png"
  },
  {
    titleKey: "services.electronic.title", 
    icon: Monitor,
    descriptionKey: "services.electronic.description",
    image: "/images/icon-2.png"
  },
  {
    titleKey: "services.cameras.title",
    icon: Camera,
    descriptionKey: "services.cameras.description",
    image: "/images/icon-3.png"
  },
  {
    titleKey: "services.consulting.title",
    icon: AlertTriangle,
    descriptionKey: "services.consulting.description",
    image: "/images/icon-4.png"
  },
  {
    titleKey: "services.training.title",
    icon: Users,
    descriptionKey: "services.training.description",
    image: "/images/icon-5.png"
  },
  {
    titleKey: "services.other.title",
    icon: Shield,
    descriptionKey: "services.other.description",
    image: "/images/icon-6.png"
  }
];

const getHeroSlides = (t: (key: string) => string) => [
  {
    image: "/lovable-uploads/8c849656-25f2-4daa-9b5d-e66a516e7b08.png",
    titleKey: "hero.slide1.title",
    subtitleKey: "hero.slide1.subtitle"
  },
  {
    image: "/lovable-uploads/ac750eed-3e14-482e-9aa8-30668ff17d9d.png", 
    titleKey: "hero.slide2.title",
    subtitleKey: "hero.slide2.subtitle"
  },
  {
    image: "/lovable-uploads/1014d84d-c8c1-4c1e-a6d5-f7c6b41f72fb.png",
    titleKey: "hero.slide3.title",
    subtitleKey: "hero.slide3.subtitle"
  }
];

export const Landing = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [visitas, setVisitas] = useState(0);
  const { t } = useLanguage();
  
  const services = getServices(t);
  const heroSlides = getHeroSlides(t);

  useEffect(() => {
    // Visitor counter logic - only count unique sessions
    const sessionKey = 'session_started';
    const sessionStarted = sessionStorage.getItem(sessionKey);
    
    if (!sessionStarted) {
      // This is a new session, count the visit
      sessionStorage.setItem(sessionKey, 'true');
      
      let visitasCount = localStorage.getItem('contador_visitas');
      if (!visitasCount) {
        visitasCount = "0";
      }
      const newCount = parseInt(visitasCount) + 1;
      localStorage.setItem('contador_visitas', newCount.toString());
      setVisitas(newCount);
    } else {
      // Load existing visit count without incrementing
      const existingCount = localStorage.getItem('contador_visitas') || "0";
      setVisitas(parseInt(existingCount));
    }

    // Auto-slide carousel
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="w-full bg-primary text-primary-foreground sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            {/* Mobile: Sidebar trigger only */}
            <div className="md:hidden">
              <LandingSidebar />
            </div>
            
            {/* Mobile: Centered title */}
            <div className="md:hidden absolute left-1/2 transform -translate-x-1/2">
              <h1 className="text-sm font-semibold text-center max-w-[200px] leading-tight">
                Seguridad Residencial y Comercial S.R.L.
              </h1>
            </div>
            
            {/* Desktop: Sidebar + title */}
            <div className="hidden md:flex items-center gap-4">
              <LandingSidebar />
              <div className="text-lg md:text-xl font-bold">
                {t('header.title')}
              </div>
            </div>
            
            {/* Desktop: Language toggle and Control de Acceso */}
            <div className="hidden md:flex items-center gap-2">
              <LanguageToggle />
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

        {/* Visitor counter */}
        <div className="bg-secondary text-secondary-foreground py-2">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm">{t('header.visitors')}: <span className="font-bold">{visitas}</span></p>
          </div>
        </div>
      </header>

      {/* Hero Section with Carousel */}
      <section id="inicio" className="relative h-[40vh] md:h-[50vh] overflow-hidden">
        {heroSlides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              backgroundImage: `url(${slide.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-black/40">
              <div className="container mx-auto px-4 h-full flex items-center justify-center">
                {slide.titleKey && (
                  <div className="text-center text-white">
                    <h1 className="text-3xl md:text-5xl font-bold mb-4">
                      {t(slide.titleKey)}
                    </h1>
                    {slide.subtitleKey && (
                      <p className="text-xl md:text-2xl">{t(slide.subtitleKey)}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {/* Carousel Controls */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        {/* Slide Indicators */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentSlide ? 'bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Services Section */}
      <section id="servicios" className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">
            {t('services.title')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6 text-center">
                  <div className="mb-4 flex justify-center">
                    <div className="bg-primary text-primary-foreground p-4 rounded-full">
                      <service.icon className="h-8 w-8" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-card-foreground">
                    {t(service.titleKey)}
                  </h3>
                  <p className="text-muted-foreground">
                    {t(service.descriptionKey)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="nosotros" className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                {t('about.title')}
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {t('about.description')}
              </p>
              <Button variant="default" size="lg" onClick={() => navigate('/about')}>
                {t('about.readMore')}
              </Button>
            </div>
            <div className="relative">
              <img 
                src="/lovable-uploads/63fce2c4-bcf0-4b70-80e4-e92402a8bee3.png" 
                alt="Sobre nosotros - Equipo SRC" 
                className="w-full h-96 object-cover rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Clients Section */}
      <section id="clientes" className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">
            {t('clients.title')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <Card className="overflow-hidden bg-white p-6 flex items-center justify-center min-h-[200px]">
              <img 
                src="/lovable-uploads/16a75dda-03e7-4bd6-990f-881b0e7c2349.png" 
                alt="Unión Europea - Delegación en República Dominicana" 
                className="w-full h-auto object-contain max-h-[150px]"
              />
            </Card>
            <Card className="overflow-hidden bg-white p-6 flex items-center justify-center min-h-[200px]">
              <img 
                src="/lovable-uploads/003029fd-2192-42ef-bdf9-c2e52ff3fb9b.png" 
                alt="Embajada de Alemania en Santo Domingo" 
                className="w-full h-auto object-contain max-h-[150px]"
              />
            </Card>
            <Card className="overflow-hidden bg-white p-6 flex items-center justify-center min-h-[200px]">
              <img 
                src="/lovable-uploads/4f4dcb4d-091f-44c1-9c3d-ef9f121b3cb6.png" 
                alt="República Francesa" 
                className="w-full h-auto object-contain max-h-[150px]"
              />
            </Card>
          </div>
          
          <div className="text-center">
            <Button variant="outline" size="lg" onClick={() => navigate('/customers')}>
              {t('clients.seeMore')}
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {t('cta.title')}
          </h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            {t('cta.description')}
          </p>
          <Button variant="secondary" size="lg" onClick={() => navigate('/about')}>
            {t('cta.knowMore')}
          </Button>
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
                <li><a href="#inicio" className="text-muted-foreground hover:text-foreground transition-colors">{t('nav.home')}</a></li>
                <li><a href="#nosotros" className="text-muted-foreground hover:text-foreground transition-colors">{t('nav.about')}</a></li>
                <li><a href="#clientes" className="text-muted-foreground hover:text-foreground transition-colors">{t('nav.customers')}</a></li>
                <li><a href="#servicios" className="text-muted-foreground hover:text-foreground transition-colors">{t('nav.services')}</a></li>
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
                  <Phone className="h-4 w-4" />
                  <span className="text-muted-foreground">809-732-5905</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <a href="https://wa.me/8098701062" className="text-muted-foreground hover:text-foreground transition-colors">809-870-1062</a>
                </li>
                <li className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <a href="mailto:contacto@src.com.do" className="text-muted-foreground hover:text-foreground transition-colors">contacto@src.com.do</a>
                </li>
                <li className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 mt-1" />
                  <span className="text-muted-foreground text-sm">C/ Luis F. Thomen No. 255, Evaristo Morales, Sto. Dgo. R.D.</span>
                </li>
              </ul>
            </div>

            {/* Social Media */}
            <div>
              <h3 className="text-lg font-semibold mb-4">{t('footer.followUs')}</h3>
              <ul className="space-y-2">
                <li className="flex items-center space-x-2">
                  <Facebook className="h-4 w-4" />
                  <a href="https://www.facebook.com/seguridadsrc/" className="text-muted-foreground hover:text-foreground transition-colors">Facebook</a>
                </li>
                <li className="flex items-center space-x-2">
                  <Twitter className="h-4 w-4" />
                  <a href="https://twitter.com/SRCseguridadRD" className="text-muted-foreground hover:text-foreground transition-colors">Twitter</a>
                </li>
                <li className="flex items-center space-x-2">
                  <Instagram className="h-4 w-4" />
                  <a href="https://instagram.com/srcseguridadrd" className="text-muted-foreground hover:text-foreground transition-colors">Instagram</a>
                </li>
                <li className="flex items-center space-x-2">
                  <Linkedin className="h-4 w-4" />
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">LinkedIn</a>
                </li>
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