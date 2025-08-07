import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
}

export const AuthLayout = ({ children, title }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col justify-start items-center" 
         style={{ background: "var(--gradient-primary)" }}>
      <div className="w-full max-w-md bg-card p-6 rounded-lg mt-8 mx-auto"
           style={{ boxShadow: "var(--shadow-elegant)" }}>
        <div className="w-full h-32 bg-gradient-to-r from-primary to-secondary rounded-lg mb-6 flex items-center justify-center">
          <h2 className="text-2xl font-bold text-primary-foreground">SRC Control</h2>
        </div>
        
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-6 text-foreground">{title}</h1>
          {children}
        </div>
      </div>
    </div>
  );
};