import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Link, useLocation } from "wouter";
import { format } from "date-fns";
import { 
  Users, 
  Mail, 
  MapPin, 
  Phone, 
  Calendar, 
  LogOut, 
  Home,
  Shield,
  FileText,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { InterestedParty } from "@shared/schema";

export default function AdminPage() {
  const { toast } = useToast();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access the admin panel.",
        variant: "destructive",
      });
      window.location.href = "/api/login";
    }
  }, [isAuthenticated, authLoading, toast]);

  // Check admin status
  const { data: adminCheck, isLoading: adminCheckLoading } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/admin/check"],
    enabled: isAuthenticated,
    retry: false,
  });

  // Fetch interested parties
  const { 
    data: interestedParties, 
    isLoading: partiesLoading,
    error: partiesError,
  } = useQuery<InterestedParty[]>({
    queryKey: ["/api/admin/interested"],
    enabled: isAuthenticated && adminCheck?.isAdmin,
    retry: false,
  });

  useEffect(() => {
    if (partiesError && isUnauthorizedError(partiesError as Error)) {
      toast({
        title: "Session Expired",
        description: "Please log in again.",
        variant: "destructive",
      });
      window.location.href = "/api/login";
    }
  }, [partiesError, toast]);

  if (authLoading || adminCheckLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!adminCheck?.isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <Shield className="w-16 h-16 text-destructive mx-auto mb-4" />
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access the admin panel. 
              Please contact an administrator if you believe this is an error.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center gap-4">
            <Button asChild variant="outline">
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                Return Home
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <a href="/api/logout">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-md">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-xl font-bold hover:opacity-80 transition-opacity">
                One Wonder Lake
              </Link>
              <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground">
                Admin
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-primary-foreground/80">
                {user?.email || user?.firstName || "Admin"}
              </span>
              <Button asChild variant="ghost" size="sm" className="text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/20">
                <a href="/api/logout">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-admin-title">
            Interested Parties Dashboard
          </h1>
          <p className="text-muted-foreground">
            View and manage residents who have expressed interest in annexation.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Interested</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <span className="text-3xl font-bold" data-testid="text-total-interested">
                  {interestedParties?.length || 0}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">From Address Checker</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                <span className="text-3xl font-bold" data-testid="text-from-address">
                  {interestedParties?.filter(p => p.source === "address_checker").length || 0}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">From Tax Estimator</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <span className="text-3xl font-bold" data-testid="text-from-tax">
                  {interestedParties?.filter(p => p.source === "tax_estimator").length || 0}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interested Parties Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Interested Parties
            </CardTitle>
            <CardDescription>
              All residents who have expressed interest in voluntary annexation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {partiesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-muted-foreground">Loading data...</p>
              </div>
            ) : partiesError ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-2" />
                <p className="text-destructive">Failed to load interested parties</p>
              </div>
            ) : !interestedParties || interestedParties.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground text-lg mb-2">No interested parties yet</p>
                <p className="text-sm text-muted-foreground">
                  Residents who express interest through the Address Checker or Tax Estimator will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {interestedParties.map((party) => (
                      <TableRow key={party.id} data-testid={`row-party-${party.id}`}>
                        <TableCell className="font-medium">{party.name}</TableCell>
                        <TableCell>
                          <a 
                            href={`mailto:${party.email}`} 
                            className="flex items-center gap-1 text-primary hover:underline"
                          >
                            <Mail className="w-3 h-3" />
                            {party.email}
                          </a>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                            <span className="max-w-[200px] truncate">{party.address}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {party.phone ? (
                            <a 
                              href={`tel:${party.phone}`}
                              className="flex items-center gap-1 text-primary hover:underline"
                            >
                              <Phone className="w-3 h-3" />
                              {party.phone}
                            </a>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={party.source === "address_checker" ? "default" : "secondary"}>
                            {party.source === "address_checker" ? "Address" : "Tax"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {party.createdAt ? format(new Date(party.createdAt), "MMM d, yyyy") : "-"}
                          </div>
                        </TableCell>
                        <TableCell>
                          {party.notes ? (
                            <span className="max-w-[150px] truncate block text-sm" title={party.notes}>
                              {party.notes}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Button asChild variant="outline">
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
