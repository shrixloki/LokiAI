import { cn } from '@/lib/utils';

interface GeometricShapesProps {
  className?: string;
}

export function GeometricShapes({ className }: GeometricShapesProps) {
  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      {/* Large gradient shapes matching LokiAi's design */}
      <div className="absolute top-1/4 right-0 w-96 h-96 transform translate-x-1/2 -translate-y-1/4">
        <div className="w-full h-full bg-gradient-primary opacity-80 blur-3xl animate-float" 
             style={{ 
               clipPath: 'polygon(0% 0%, 70% 0%, 100% 30%, 100% 100%, 30% 100%, 0% 70%)'
             }} 
        />
      </div>
      
      <div className="absolute top-1/2 right-1/4 w-64 h-64 transform translate-x-1/4 -translate-y-1/2">
        <div className="w-full h-full bg-gradient-accent opacity-60 blur-2xl animate-float delay-1000"
             style={{ 
               clipPath: 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)'
             }}
        />
      </div>

      <div className="absolute top-3/4 right-1/3 w-48 h-48 transform translate-x-1/3 -translate-y-1/2">
        <div className="w-full h-full bg-gradient-secondary opacity-40 blur-xl animate-float delay-2000"
             style={{ 
               clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 70% 100%, 30% 100%, 0% 70%)'
             }}
        />
      </div>

      {/* Additional smaller geometric elements */}
      <div className="absolute top-1/3 right-10 w-32 h-32 bg-gradient-primary opacity-30 rounded-2xl transform rotate-45 animate-float delay-500" />
      <div className="absolute bottom-1/4 right-20 w-24 h-24 bg-gradient-accent opacity-25 rounded-full animate-float delay-1500" />
    </div>
  );
}

export function DashboardGeometricShapes({ className }: GeometricShapesProps) {
  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
      {/* Subtle background geometric patterns for dashboard */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5">
        <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-primary rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-gradient-accent rounded-full blur-2xl" />
        <div className="absolute top-1/2 right-1/3 w-32 h-32 bg-gradient-secondary rounded-full blur-xl" />
      </div>
    </div>
  );
}