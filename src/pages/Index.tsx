
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">OccuTrack</h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10">
            Smart classroom and facility management for modern educational institutions.
            Track occupancy, reserve spaces, and optimize your campus resources.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="px-8 py-6 text-lg">
              <Link to="/dashboard">View Dashboard</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="px-8 py-6 text-lg">
              <Link to="/rooms">Browse Rooms</Link>
            </Button>
            <Button asChild variant="secondary" size="lg" className="px-8 py-6 text-lg">
              <Link to="/roles">Switch Roles</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
