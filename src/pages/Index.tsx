
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Building } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-muted">
      <div className="flex-grow flex items-center justify-center">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 rounded-lg bg-primary flex items-center justify-center">
              <Building className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6">NEU OccuTrack</h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10">
            Smart classroom and facility management for modern educational institutions.
            Track occupancy, reserve spaces, and optimize your campus resources.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="px-8">
              <Link to="/login">
                Login
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="px-8">
              <Link to="/register">
                Register
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
