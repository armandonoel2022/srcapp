import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LandingSidebar } from "@/components/LandingSidebar";
import { SettingsMenu } from "@/components/SettingsMenu";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import { Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const About = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const missionVisionValues = [
    {
      titleKey: "about.mission.title",
      contentKey: "about.mission.content",
      stars: 5
    },
    {
      titleKey: "about.vision.title", 
      contentKey: "about.vision.content",
      stars: 5
    },
    {
      titleKey: "about.values.title",
      contentKey: "about.values.content",
      stars: 5
    }
  ];

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
            backgroundImage: `url(/lovable-uploads/63fce2c4-bcf0-4b70-80e4-e92402a8bee3.png)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-black/40">
            <div className="container mx-auto px-4 h-full flex items-center justify-center">
              <div className="text-center text-white">
                <h1 className="text-3xl md:text-5xl font-bold">
                  {t('about.pageTitle')}
                </h1>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Content Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
            <div className="relative">
              <img 
                src="/lovable-uploads/63fce2c4-bcf0-4b70-80e4-e92402a8bee3.png" 
                alt="Sobre nosotros - Equipo SRC" 
                className="w-full h-96 object-cover rounded-lg shadow-lg"
              />
            </div>
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                {t('about.whyChooseUs')}
              </h2>
              <div className="space-y-4 text-muted-foreground text-lg leading-relaxed">
                <p>{t('about.description1')}</p>
                <p>{t('about.description2')}</p>
              </div>
              
              <h3 className="text-2xl font-bold text-foreground mt-8">
                {t('about.ourGoal')}
              </h3>
              <div className="space-y-4 text-muted-foreground text-lg leading-relaxed">
                <p>{t('about.goal1')}</p>
                <p>{t('about.goal2')}</p>
                <p>{t('about.goal3')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission, Vision, Values Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">
            {t('about.knowAboutUs')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {missionVisionValues.map((item, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6 text-center">
                  <div className="mb-4 flex justify-center space-x-1">
                    {[...Array(item.stars)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <h3 className="text-xl font-semibold mb-4 text-card-foreground">
                    {t(item.titleKey)}
                  </h3>
                  <div className="text-muted-foreground space-y-2">
                    {t(item.contentKey).split('\n').map((line, i) => (
                      line.trim() && <p key={i}>{line.trim()}</p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
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
                <li><a href="/#clientes" className="text-muted-foreground hover:text-foreground transition-colors">{t('nav.customers')}</a></li>
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