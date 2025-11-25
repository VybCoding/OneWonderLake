import { useEffect, useState } from "react";
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
  AlertCircle,
  Search,
  X,
  Download,
  ThumbsUp,
  ThumbsDown
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import type { InterestedParty, SearchedAddress } from "@shared/schema";

export default function AdminPage() {
  const { toast } = useToast();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedParty, setSelectedParty] = useState<InterestedParty | null>(null);

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

  // Fetch searched addresses
  const { 
    data: searchedAddresses, 
    isLoading: addressesLoading,
    error: addressesError,
  } = useQuery<SearchedAddress[]>({
    queryKey: ["/api/admin/searched-addresses"],
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

  const exportToCSV = () => {
    if (!interestedParties || interestedParties.length === 0) {
      toast({
        title: "No Data",
        description: "There are no interested parties to export.",
        variant: "destructive",
      });
      return;
    }

    // Define CSV headers
    const headers = ["Name", "Email", "Phone", "Address", "Interest Status", "Source", "Date Added", "Notes"];

    // Convert data to CSV rows
    const rows = interestedParties.map((party) => [
      `"${party.name.replace(/"/g, '""')}"`,
      `"${party.email.replace(/"/g, '""')}"`,
      `"${(party.phone || "").replace(/"/g, '""')}"`,
      `"${party.address.replace(/"/g, '""')}"`,
      party.interested === false ? "Not Interested" : "Interested",
      party.source === "address_checker" ? "Address Checker" : "Tax Estimator",
      party.createdAt ? format(new Date(party.createdAt), "MMM d, yyyy h:mm a") : "",
      `"${(party.notes || "").replace(/"/g, '""').replace(/\n/g, " ")}"`,
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `interested_parties_${format(new Date(), "yyyy-MM-dd_HHmmss")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: `Exported ${interestedParties.length} interested parties to CSV.`,
    });
  };

  const exportAddressSearchesToCSV = () => {
    if (!searchedAddresses || searchedAddresses.length === 0) {
      toast({
        title: "No Data",
        description: "There are no address searches to export.",
        variant: "destructive",
      });
      return;
    }

    // Define CSV headers
    const headers = ["Address", "Result", "Municipality", "Date"];

    // Convert data to CSV rows
    const rows = searchedAddresses.map((search) => [
      `"${search.address.replace(/"/g, '""')}"`,
      search.result === "resident" ? "Village Resident" :
      search.result === "annexation" ? "Annexation Zone" :
      search.result === "other_municipality" ? "Other Municipality" :
      search.result === "outside_area" ? "Outside Area" :
      "Not Found",
      `"${(search.municipalityName || "").replace(/"/g, '""')}"`,
      search.createdAt ? format(new Date(search.createdAt), "MMM d, yyyy h:mm a") : "",
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `address_searches_${format(new Date(), "yyyy-MM-dd_HHmmss")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: `Exported ${searchedAddresses.length} address searches to CSV.`,
    });
  };

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
            Community Sentiment Dashboard
          </h1>
          <p className="text-muted-foreground">
            View and manage resident feedback on annexation, both interested and disinterested.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Interested</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <ThumbsUp className="w-5 h-5 text-green-600" />
                <span className="text-3xl font-bold text-green-600" data-testid="text-total-interested">
                  {interestedParties?.filter(p => p.interested !== false).length || 0}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Not Interested</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <ThumbsDown className="w-5 h-5 text-red-600" />
                <span className="text-3xl font-bold text-red-600" data-testid="text-total-disinterested">
                  {interestedParties?.filter(p => p.interested === false).length || 0}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Address Searches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-primary" />
                <span className="text-3xl font-bold" data-testid="text-total-searches">
                  {searchedAddresses?.length || 0}
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

        {/* Data Tables with Tabs */}
        <Tabs defaultValue="responses" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="responses" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Responses ({interestedParties?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="searches" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Address Searches ({searchedAddresses?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="responses">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Resident Responses
                    </CardTitle>
                    <CardDescription>
                      All residents who have shared their stance on annexation
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={exportToCSV}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    data-testid="button-export-csv"
                  >
                    <Download className="w-4 h-4" />
                    Export to CSV
                  </Button>
                </div>
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
                    <p className="text-muted-foreground text-lg mb-2">No responses yet</p>
                    <p className="text-sm text-muted-foreground">
                      Residents who share their stance through the Address Checker or Tax Estimator will appear here.
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
                          <TableHead>Interest</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Source</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {interestedParties.map((party) => (
                          <TableRow 
                            key={party.id} 
                            data-testid={`row-party-${party.id}`}
                            className="cursor-pointer hover-elevate"
                            onClick={() => setSelectedParty(party)}
                          >
                            <TableCell className="font-medium">{party.name}</TableCell>
                            <TableCell>
                              <a 
                                href={`mailto:${party.email}`}
                                onClick={(e) => e.stopPropagation()}
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
                              {party.interested === false ? (
                                <Badge variant="destructive" className="flex items-center gap-1 w-fit" data-testid={`badge-interest-${party.id}`}>
                                  <ThumbsDown className="w-3 h-3" />
                                  No
                                </Badge>
                              ) : (
                                <Badge className="flex items-center gap-1 w-fit bg-green-600 hover:bg-green-700" data-testid={`badge-interest-${party.id}`}>
                                  <ThumbsUp className="w-3 h-3" />
                                  Yes
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {party.phone ? (
                                <a 
                                  href={`tel:${party.phone}`}
                                  onClick={(e) => e.stopPropagation()}
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
          </TabsContent>

          <TabsContent value="searches">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Search className="w-5 h-5" />
                      Address Searches
                    </CardTitle>
                    <CardDescription>
                      All addresses that have been looked up in the Address Checker
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={exportAddressSearchesToCSV}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    data-testid="button-export-searches-csv"
                  >
                    <Download className="w-4 h-4" />
                    Export to CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {addressesLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-muted-foreground">Loading data...</p>
                  </div>
                ) : addressesError ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-2" />
                    <p className="text-destructive">Failed to load searched addresses</p>
                  </div>
                ) : !searchedAddresses || searchedAddresses.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground text-lg mb-2">No address searches yet</p>
                    <p className="text-sm text-muted-foreground">
                      Addresses looked up in the Address Checker will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Address</TableHead>
                          <TableHead>Result</TableHead>
                          <TableHead>Municipality</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {searchedAddresses.map((search) => (
                          <TableRow key={search.id} data-testid={`row-search-${search.id}`}>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                <span className="max-w-[300px] truncate">{search.address}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  search.result === "resident" ? "default" :
                                  search.result === "annexation" ? "secondary" :
                                  search.result === "other_municipality" ? "outline" :
                                  "destructive"
                                }
                              >
                                {search.result === "resident" ? "Village Resident" :
                                 search.result === "annexation" ? "Annexation Zone" :
                                 search.result === "other_municipality" ? "Other Municipality" :
                                 search.result === "outside_area" ? "Outside Area" :
                                 "Not Found"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {search.municipalityName ? (
                                <span className="text-sm">{search.municipalityName}</span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                {search.createdAt ? format(new Date(search.createdAt), "MMM d, yyyy h:mm a") : "-"}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

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

      {/* Party Details Dialog */}
      <Dialog open={!!selectedParty} onOpenChange={(open) => !open && setSelectedParty(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-party-details">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0">
            <DialogTitle>Party Details</DialogTitle>
            <DialogClose className="opacity-70 hover:opacity-100" data-testid="button-close-dialog">
              <X className="h-4 w-4" />
            </DialogClose>
          </DialogHeader>

          {selectedParty && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{selectedParty.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <a 
                      href={`mailto:${selectedParty.email}`}
                      className="text-primary hover:underline font-medium"
                    >
                      {selectedParty.email}
                    </a>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">
                      {selectedParty.phone ? (
                        <a href={`tel:${selectedParty.phone}`} className="text-primary hover:underline">
                          {selectedParty.phone}
                        </a>
                      ) : (
                        "-"
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date Added</p>
                    <p className="font-medium">
                      {selectedParty.createdAt ? format(new Date(selectedParty.createdAt), "MMM d, yyyy h:mm a") : "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Address Information</h3>
                <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                  <MapPin className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
                  <p className="font-medium break-words">{selectedParty.address}</p>
                </div>
              </div>

              {/* Interest & Source Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Interest & Source</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Interest Status</p>
                    {selectedParty.interested === false ? (
                      <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                        <ThumbsDown className="w-3 h-3" />
                        Not Interested
                      </Badge>
                    ) : (
                      <Badge className="flex items-center gap-1 w-fit bg-green-600 hover:bg-green-700">
                        <ThumbsUp className="w-3 h-3" />
                        Interested
                      </Badge>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Source</p>
                    <Badge variant={selectedParty.source === "address_checker" ? "default" : "secondary"}>
                      {selectedParty.source === "address_checker" ? "Address Checker" : "Tax Estimator"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              {selectedParty.notes && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Notes</h3>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm whitespace-pre-wrap break-words">{selectedParty.notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
