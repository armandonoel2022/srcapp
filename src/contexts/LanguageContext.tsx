import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'es' | 'en';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  es: {
    // Header
    'header.title': 'Seguridad Residencial y Comercial S.R.L.',
    'header.accessControl': 'Control de Acceso',
    'header.visitors': 'Visitas',
    
    // Navigation
    'nav.home': 'Inicio',
    'nav.about': 'Sobre nosotros',
    'nav.customers': 'Clientes',
    'nav.services': 'Servicios',
    'nav.navigation': 'Navegación',
    
    // Hero section
    'hero.slide1.title': 'Seguridad Confiable y Profesional',
    'hero.slide1.subtitle': 'Protegemos lo que más valoras',
    'hero.slide2.title': 'Seguridad personalizada a su medida',
    'hero.slide2.subtitle': 'Vehículos blindados y escoltas especializadas',
    'hero.slide3.title': 'Centro de Monitoreo 24/7',
    'hero.slide3.subtitle': 'Vigilancia constante para tu tranquilidad',
    
    // Services
    'services.title': 'Nuestros Servicios',
    'services.security.title': 'Seguridad y Protección',
    'services.security.description': 'Oficiales de seguridad con o sin armas para proteger vidas, bienes y propiedades.',
    'services.electronic.title': 'Seguridad electrónica',
    'services.electronic.description': 'Sistemas de alarmas inalámbricas PowerMaster-10 y PowerMaster-30.',
    'services.cameras.title': 'Cámaras de seguridad',
    'services.cameras.description': 'Sistemas integrados de vigilancia con alta eficiencia en rendimiento.',
    'services.consulting.title': 'Consultoría de Seguridad',
    'services.consulting.description': 'Análisis de riesgos con recomendaciones para mejorar sistemas de seguridad.',
    'services.training.title': 'Capacitaciones',
    'services.training.description': 'Charlas preventivas para minimizar riesgos de asaltos y fraudes.',
    'services.other.title': 'Otros servicios',
    'services.other.description': 'Investigaciones especiales, GPS tracking, drones y más.',
    
    // About
    'about.title': 'Sobre nosotros',
    'about.description': 'Somos una empresa Dominicana con raíces internacionales, que tiene por objetivo desarrollar, establecer y realizar todo tipo de servicios de seguridad según la necesidad del cliente, en el sector público y privado a nivel nacional e internacional.',
    'about.readMore': 'Leer más',
    'about.pageTitle': 'Sobre nosotros',
    'about.whyChooseUs': '¿Por qué elegirnos?',
    'about.description1': 'Ofrecemos servicios de seguridad, que mediante el trato personalizado protegemos los bienes y servicios garantizando la tranquilidad de nuestros clientes, SRC le brinda soluciones personalizadas de acuerdo a la medida de su requerimiento.',
    'about.description2': 'SRC está compuesta por un equipo de profesionales y consultores internacionales. Todo nuestro personal está altamente entrenado y capacitado en sus diferentes áreas de responsabilidad.',
    'about.ourGoal': 'Nuestra meta',
    'about.goal1': 'Cada cliente requiere soluciones distintas, por eso establecemos una relación muy directa con cada uno de ellos, creando sistemas individualizados con oficiales de seguridad especializados en las diferentes áreas.',
    'about.goal2': 'Fieles a los más altos controles de calidad, trabajamos proactivamente para fomentar y mantener el vínculo con nuestros clientes, garantizando su seguridad y la de los suyos.',
    'about.goal3': '"Aportamos soluciones a la medida". Operamos profesionalmente y cumpliendo siempre con nuestras obligaciones legales.',
    'about.knowAboutUs': 'Conócenos',
    'about.mission.title': 'Misión',
    'about.mission.content': 'Asegurar los bienes de nuestros clientes y ofrecerles protección personalizada, dando la seguridad exigida por el cliente y garantizando la satisfacción a la medida. Nuestro compromiso con los clientes es: Aportarle tranquilidad, seguridad, apoyo y confianza.',
    'about.vision.title': 'Visión',
    'about.vision.content': 'Cada cliente tiene necesidades distintas, por lo cual las soluciones pueden ser diferentes una de otra; Es por eso que nos enfocamos en analizar detenidamente con nuestro cliente sus inquietudes, para poder presentarles soluciones ajustadas a sus requerimientos de una manera práctica, sencilla y dentro de su presupuesto.',
    'about.values.title': 'Valores',
    'about.values.content': 'Puntualidad\nResponsabilidad\nTrato personalizado\nCapacitación a nuestro personal\nRespuesta',
    
    // Clients
    'clients.title': 'Nuestros Clientes',
    'clients.seeMore': 'Ver más',
    'clients.allClientsShown': 'Mostrando todos nuestros clientes',
    
    // CTA
    'cta.title': 'Conócenos',
    'cta.description': 'Somos una Empresa Dominicana especializada en servicios de seguridad, fundada en el año 2004 como respuesta a la creciente demanda de servicios de seguridad con una mejor calidad en la República Dominicana.',
    'cta.knowMore': 'Conoce más',
    
    // Footer
    'footer.quickLinks': 'Enlaces rápidos',
    'footer.additionalLinks': 'Enlaces adicionales',
    'footer.contact': 'Contacto',
    'footer.followUs': 'Síguenos',
    'footer.leaveMessage': 'Déjanos un mensaje',
    'footer.privacy': 'Políticas de privacidad',
    'footer.terms': 'Términos y condiciones',
    'footer.madeBy': 'Elaborado por',
    'footer.rights': 'All Rights Reserved!'
  },
  en: {
    // Header
    'header.title': 'Seguridad Residencial y Comercial S.R.L.',
    'header.accessControl': 'Access Control',
    'header.visitors': 'Visitors',
    
    // Navigation
    'nav.home': 'Home',
    'nav.about': 'About us',
    'nav.customers': 'Customers',
    'nav.services': 'Services',
    'nav.navigation': 'Navigation',
    
    // Hero section
    'hero.slide1.title': 'Reliable and Professional Security',
    'hero.slide1.subtitle': 'We protect what you value most',
    'hero.slide2.title': 'Customized security for you',
    'hero.slide2.subtitle': 'Armored vehicles and specialized escorts',
    'hero.slide3.title': 'Monitoring Center 24/7',
    'hero.slide3.subtitle': 'Constant surveillance for your peace of mind',
    
    // Services
    'services.title': 'Our Services',
    'services.security.title': 'Protection and Security',
    'services.security.description': 'Security officers with or without weapons, to protect lives, assets and property.',
    'services.electronic.title': 'Electronic Security',
    'services.electronic.description': 'PowerMaster-10 and PowerMaster-30 wireless alarm systems.',
    'services.cameras.title': 'Security cameras',
    'services.cameras.description': 'Integrated surveillance systems with high efficiency in their performance.',
    'services.consulting.title': 'Security Consulting',
    'services.consulting.description': 'Risk analysis with recommendations to improve your security systems.',
    'services.training.title': 'Trainings',
    'services.training.description': 'Preventive talks to minimize risks of assaults and fraud.',
    'services.other.title': 'Other Services',
    'services.other.description': 'Special investigations, GPS tracking, drones and more.',
    
    // About
    'about.title': 'About us',
    'about.description': 'We are a Dominican company with international roots, whose objective is to develop, establish and carry out all kinds of security services according to the client\'s needs, in the public and private sector at a national and international level.',
    'about.readMore': 'Read more',
    'about.pageTitle': 'About us',
    'about.whyChooseUs': 'Why choose us?',
    'about.description1': 'We offer security services, which through personalized treatment we protect goods and services guaranteeing the peace of mind of our customers, SRC provides personalized solutions according to the extent of your requirement.',
    'about.description2': 'SRC is made up of a team of international professionals and consultants. All our staff is highly trained and qualified in their different areas of responsibility.',
    'about.ourGoal': 'Our goal',
    'about.goal1': 'Each client requires different solutions, which is why we establish a very direct relationship with each of them, creating individualized systems with specialized security officers in different areas.',
    'about.goal2': 'Faithful to the highest quality controls, we work proactively to promote and maintain the link with our clients, guaranteeing their safety and that of their loved ones.',
    'about.goal3': '"We provide tailor-made solutions". We operate professionally and always complying with our legal obligations.',
    'about.knowAboutUs': 'Know about us',
    'about.mission.title': 'Mission',
    'about.mission.content': 'Insure the assets of our clients and offer them personalized protection, giving the security required by the client and guaranteeing tailor-made satisfaction. Our commitment to customers is: Provide peace of mind, security, support and confidence.',
    'about.vision.title': 'Vision',
    'about.vision.content': 'Each client has various needs, thus each solution may be different. Because of this, we concentrate on carefully discussing our clients\' concerns with them in order to propose solutions that are realistic, easy to understand, and within their budgets.',
    'about.values.title': 'Values',
    'about.values.content': 'Puntuality\nResponsibility\nPersonalized\nTraining and coaching of our staff\nQuick answer',
    
    // Clients
    'clients.title': 'Our Customers',
    'clients.seeMore': 'Know more',
    'clients.allClientsShown': 'Showing all our clients',
    
    // CTA
    'cta.title': 'Know more about us',
    'cta.description': 'We are a Dominican company specialized in security services, founded in 2004 in response to the growing demand for better quality security services in the Dominican Republic.',
    'cta.knowMore': 'Know more',
    
    // Footer
    'footer.quickLinks': 'Quick Links',
    'footer.additionalLinks': 'Extra Links',
    'footer.contact': 'Contact Info',
    'footer.followUs': 'Follow us',
    'footer.leaveMessage': 'Leave a message',
    'footer.privacy': 'Privacy policies',
    'footer.terms': 'Terms and Conditions',
    'footer.madeBy': 'Made by',
    'footer.rights': 'All Rights Reserved!'
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('es'); // Spanish as default

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'es' || savedLanguage === 'en')) {
      setLanguage(savedLanguage);
    }
  }, []);

  const toggleLanguage = () => {
    const newLanguage = language === 'es' ? 'en' : 'es';
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['es']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};