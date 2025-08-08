import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
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

const services = [
  {
    title: "Seguridad y Protección",
    icon: Shield,
    description: "Oficiales de seguridad con o sin armas para proteger vidas, bienes y propiedades.",
    image: "/images/icon-1.png"
  },
  {
    title: "Seguridad electrónica", 
    icon: Monitor,
    description: "Sistemas de alarmas inalámbricas PowerMaster-10 y PowerMaster-30.",
    image: "/images/icon-2.png"
  },
  {
    title: "Cámaras de seguridad",
    icon: Camera,
    description: "Sistemas integrados de vigilancia con alta eficiencia en rendimiento.",
    image: "/images/icon-3.png"
  },
  {
    title: "Consultoría de Seguridad",
    icon: AlertTriangle,
    description: "Análisis de riesgos con recomendaciones para mejorar sistemas de seguridad.",
    image: "/images/icon-4.png"
  },
  {
    title: "Capacitaciones",
    icon: Users,
    description: "Charlas preventivas para minimizar riesgos de asaltos y fraudes.",
    image: "/images/icon-5.png"
  },
  {
    title: "Otros servicios",
    icon: Shield,
    description: "Investigaciones especiales, GPS tracking, drones y más.",
    image: "/images/icon-6.png"
  }
];

const heroSlides = [
  {
    image: "/lovable-uploads/8c849656-25f2-4daa-9b5d-e66a516e7b08.png",
    title: "Seguridad Confiable y Profesional",
    subtitle: "Protegemos lo que más valoras"
  },
  {
    image: "/lovable-uploads/ac750eed-3e14-482e-9aa8-30668ff17d9d.png", 
    title: "Seguridad personalizada a su medida",
    subtitle: "Vehículos blindados y escoltas especializadas"
  },
  {
    image: "/lovable-uploads/1014d84d-c8c1-4c1e-a6d5-f7c6b41f72fb.png",
    title: "Centro de Monitoreo 24/7",
    subtitle: "Vigilancia constante para tu tranquilidad"
  }
];

export const Landing = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [visitas, setVisitas] = useState(0);

  useEffect(() => {
    // Visitor counter logic
    let visitasCount = localStorage.getItem('contador_visitas');
    if (!visitasCount) {
      visitasCount = "0";
    }
    const newCount = parseInt(visitasCount) + 1;
    localStorage.setItem('contador_visitas', newCount.toString());
    setVisitas(newCount);

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
          <div className="flex items-center justify-between py-4">
            <div className="text-xl md:text-2xl font-bold">
              Seguridad Residencial y Comercial S.R.L.
            </div>
            
            <nav className="hidden md:flex space-x-6">
              <a href="#inicio" className="hover:text-accent transition-colors">Inicio</a>
              <a href="#nosotros" className="hover:text-accent transition-colors">Sobre nosotros</a>
              <a href="#clientes" className="hover:text-accent transition-colors">Clientes</a>
              <a href="#servicios" className="hover:text-accent transition-colors">Servicios</a>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => navigate('/auth')}
                className="ml-4"
              >
                Control de Acceso
              </Button>
            </nav>

            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => navigate('/auth')}
              className="md:hidden"
            >
              Control de Acceso
            </Button>
          </div>
        </div>

        {/* Visitor counter */}
        <div className="bg-secondary text-secondary-foreground py-2">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm">Visitas: <span className="font-bold">{visitas}</span></p>
          </div>
        </div>
      </header>

      {/* Hero Section with Carousel */}
      <section id="inicio" className="relative h-[60vh] md:h-[80vh] overflow-hidden">
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
                {slide.title && (
                  <div className="text-center text-white">
                    <h1 className="text-3xl md:text-5xl font-bold mb-4">
                      {slide.title}
                    </h1>
                    {slide.subtitle && (
                      <p className="text-xl md:text-2xl">{slide.subtitle}</p>
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
            Nuestros Servicios
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
                    {service.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {service.description}
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
                Sobre nosotros
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Somos una empresa Dominicana con raíces internacionales, que tiene por objetivo 
                desarrollar, establecer y realizar todo tipo de servicios de seguridad según la 
                necesidad del cliente, en el sector público y privado a nivel nacional e internacional.
              </p>
              <Button variant="default" size="lg">
                Leer más
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
            Nuestros Clientes
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
            <Button variant="outline" size="lg">
              Ver más
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Conócenos
          </h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Somos una Empresa Dominicana especializada en servicios de seguridad, 
            fundada en el año 2004 como respuesta a la creciente demanda de servicios 
            de seguridad con una mejor calidad en la República Dominicana.
          </p>
          <Button variant="secondary" size="lg">
            Conoce más
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card text-card-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Enlaces rápidos</h3>
              <ul className="space-y-2">
                <li><a href="#inicio" className="text-muted-foreground hover:text-foreground transition-colors">Inicio</a></li>
                <li><a href="#nosotros" className="text-muted-foreground hover:text-foreground transition-colors">Sobre nosotros</a></li>
                <li><a href="#clientes" className="text-muted-foreground hover:text-foreground transition-colors">Clientes</a></li>
                <li><a href="#servicios" className="text-muted-foreground hover:text-foreground transition-colors">Servicios</a></li>
              </ul>
            </div>

            {/* Additional Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Enlaces adicionales</h3>
              <ul className="space-y-2">
                <li><a href="mailto:contacto@src.com.do" className="text-muted-foreground hover:text-foreground transition-colors">Déjanos un mensaje</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Políticas de privacidad</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Términos y condiciones</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Contacto</h3>
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
              <h3 className="text-lg font-semibold mb-4">Síguenos</h3>
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
              Elaborado por <span className="text-foreground font-semibold">Armando Noel Diseñador Web</span> | All Rights Reserved!
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};