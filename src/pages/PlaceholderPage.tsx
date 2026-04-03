import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Construction className="size-12 text-muted-foreground/50 mb-4" />
          <p className="text-lg font-medium">Módulo em Desenvolvimento</p>
          <p className="text-sm text-muted-foreground mt-1">
            Este módulo será implementado em breve.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
