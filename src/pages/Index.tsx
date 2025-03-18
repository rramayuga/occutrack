
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { UserCheck, Building } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Facility Tracker</h1>
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
            <Button asChild size="lg" variant="secondary" className="px-8">
              <Link to="/roles">
                <UserCheck className="mr-2" />
                Change Role
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
