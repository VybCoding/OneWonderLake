import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  ThumbsDown,
  RotateCcw,
  MessageCircleQuestion,
  Send,
  Check,
  BookOpen,
  Sparkles,
  Trash2
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
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { InterestedParty, SearchedAddress, CommunityQuestion, DynamicFaq } from "@shared/schema";

const categoryLabels: Record<string, string> = {
  general: "General",
  taxes: "Taxes & Finances",
  property_rights: "Property Rights",
  services: "Village Services",
};

const categoryColors: Record<string, string> = {
  general: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  taxes: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  property_rights: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  services: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

export default function AdminPage() {
  const { toast } = useToast();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedParty, setSelectedParty] = useState<InterestedParty | null>(null);
  const [interestFilter, setInterestFilter] = useState<boolean | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<CommunityQuestion | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [showNewFaqDialog, setShowNewFaqDialog] = useState(false);
  const [newFaqQuestion, setNewFaqQuestion] = useState("");
  const [newFaqAnswer, setNewFaqAnswer] = useState("");
  const [newFaqCategory, setNewFaqCategory] = useState("general");

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

  const { data: adminCheck, isLoading: adminCheckLoading } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/admin/check"],
    enabled: isAuthenticated,
    retry: false,
  });

  const { 
    data: interestedParties, 
    isLoading: partiesLoading,
    error: partiesError,
  } = useQuery<InterestedParty[]>({
    queryKey: ["/api/admin/interested"],
    enabled: isAuthenticated && adminCheck?.isAdmin,
    retry: false,
  });

  const { 
    data: searchedAddresses, 
    isLoading: addressesLoading,
    error: addressesError,
  } = useQuery<SearchedAddress[]>({
    queryKey: ["/api/admin/searched-addresses"],
    enabled: isAuthenticated && adminCheck?.isAdmin,
    retry: false,
  });

  const { 
    data: communityQuestions, 
    isLoading: questionsLoading,
    error: questionsError,
  } = useQuery<CommunityQuestion[]>({
    queryKey: ["/api/admin/questions"],
    enabled: isAuthenticated && adminCheck?.isAdmin,
    retry: false,
  });

  const { 
    data: dynamicFaqs, 
    isLoading: faqsLoading,
  } = useQuery<DynamicFaq[]>({
    queryKey: ["/api/dynamic-faqs"],
    enabled: isAuthenticated && adminCheck?.isAdmin,
    retry: false,
  });

  const answerMutation = useMutation({
    mutationFn: async ({ id, answer }: { id: string; answer: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/questions/${id}/answer`, { answer });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/questions"] });
      toast({
        title: "Answer Saved",
        description: "The question has been answered successfully.",
      });
      setSelectedQuestion(null);
      setAnswerText("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save the answer. Please try again.",
        variant: "destructive",
      });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/admin/questions/${id}/publish`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/questions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dynamic-faqs"] });
      toast({
        title: "Published to FAQ",
        description: "The question has been published to the FAQ section.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to publish to FAQ. Make sure the question is answered first.",
        variant: "destructive",
      });
    },
  });

  const createFaqMutation = useMutation({
    mutationFn: async (data: { question: string; answer: string; category: string }) => {
      const response = await apiRequest("POST", "/api/admin/faqs", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dynamic-faqs"] });
      toast({
        title: "FAQ Created",
        description: "The new FAQ has been added successfully.",
      });
      setShowNewFaqDialog(false);
      setNewFaqQuestion("");
      setNewFaqAnswer("");
      setNewFaqCategory("general");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create the FAQ. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteFaqMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/admin/faqs/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dynamic-faqs"] });
      toast({
        title: "FAQ Deleted",
        description: "The FAQ has been removed successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete the FAQ. Please try again.",
        variant: "destructive",
      });
    },
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

    const headers = ["Name", "Email", "Phone", "Address", "Interest Status", "Source", "Date Added", "Notes"];
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

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

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

    const headers = ["Address", "Result", "Municipality", "Date"];
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

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

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

  const pendingQuestions = communityQuestions?.filter(q => q.status === "pending") || [];
  const answeredQuestions = communityQuestions?.filter(q => q.status === "answered") || [];
  const publishedQuestions = communityQuestions?.filter(q => q.status === "published") || [];

  return (
    <div className="min-h-screen bg-background">
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

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-admin-title">
            Community Sentiment Dashboard
          </h1>
          <p className="text-muted-foreground">
            View and manage resident feedback on annexation, both interested and disinterested.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <Card 
            className={`cursor-pointer transition-all hover-elevate ${interestFilter === true ? 'ring-2 ring-green-600 ring-offset-2' : ''}`}
            onClick={() => setInterestFilter(interestFilter === true ? null : true)}
            data-testid="card-filter-interested"
          >
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

          <Card 
            className={`cursor-pointer transition-all hover-elevate ${interestFilter === false ? 'ring-2 ring-red-600 ring-offset-2' : ''}`}
            onClick={() => setInterestFilter(interestFilter === false ? null : false)}
            data-testid="card-filter-disinterested"
          >
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
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <MessageCircleQuestion className="w-5 h-5 text-amber-600" />
                <span className="text-3xl font-bold text-amber-600" data-testid="text-pending-questions">
                  {pendingQuestions.length}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Published FAQs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <span className="text-3xl font-bold" data-testid="text-published-faqs">
                  {dynamicFaqs?.length || 0}
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

        <Tabs defaultValue="responses" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="responses" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Responses ({
                interestFilter === null 
                  ? interestedParties?.length || 0
                  : interestFilter === true
                    ? interestedParties?.filter(p => p.interested !== false).length || 0
                    : interestedParties?.filter(p => p.interested === false).length || 0
              })
            </TabsTrigger>
            <TabsTrigger value="questions" className="flex items-center gap-2">
              <MessageCircleQuestion className="w-4 h-4" />
              Questions ({communityQuestions?.length || 0})
              {pendingQuestions.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {pendingQuestions.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="faqs" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Published FAQs ({dynamicFaqs?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="searches" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Address Searches ({searchedAddresses?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="responses">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 flex-wrap">
                      <Users className="w-5 h-5" />
                      Resident Responses
                      {interestFilter !== null && (
                        <Badge 
                          variant={interestFilter ? "default" : "destructive"} 
                          className={`ml-2 ${interestFilter ? 'bg-green-600' : ''}`}
                        >
                          {interestFilter ? (
                            <><ThumbsUp className="w-3 h-3 mr-1" /> Interested Only</>
                          ) : (
                            <><ThumbsDown className="w-3 h-3 mr-1" /> Not Interested Only</>
                          )}
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {interestFilter === null 
                        ? "All residents who have shared their stance on annexation"
                        : interestFilter 
                          ? "Showing only residents interested in annexation"
                          : "Showing only residents not interested in annexation"
                      }
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {interestFilter !== null && (
                      <Button 
                        onClick={() => setInterestFilter(null)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                        data-testid="button-reset-filter"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Reset Filter
                      </Button>
                    )}
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
                        {interestedParties
                          .filter(p => {
                            if (interestFilter === null) return true;
                            if (interestFilter === true) return p.interested !== false;
                            return p.interested === false;
                          })
                          .map((party) => (
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

          <TabsContent value="questions">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircleQuestion className="w-5 h-5" />
                      Community Questions
                    </CardTitle>
                    <CardDescription>
                      Questions submitted by residents - answer them and publish to FAQ
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {questionsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-muted-foreground">Loading questions...</p>
                  </div>
                ) : questionsError ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-2" />
                    <p className="text-destructive">Failed to load questions</p>
                  </div>
                ) : !communityQuestions || communityQuestions.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircleQuestion className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground text-lg mb-2">No questions yet</p>
                    <p className="text-sm text-muted-foreground">
                      Questions submitted through the FAQ section will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {pendingQuestions.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                            Pending ({pendingQuestions.length})
                          </Badge>
                        </h3>
                        <div className="space-y-4">
                          {pendingQuestions.map((q) => (
                            <Card key={q.id} className="border-amber-200" data-testid={`card-question-${q.id}`}>
                              <CardContent className="pt-4">
                                <div className="flex justify-between items-start gap-4 mb-3">
                                  <div className="flex-1">
                                    <p className="font-medium text-foreground mb-2">{q.question}</p>
                                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                                      <span>{q.name}</span>
                                      <span>•</span>
                                      <span>{q.email}</span>
                                      <span>•</span>
                                      <Badge className={`text-xs ${categoryColors[q.category]}`}>
                                        {categoryLabels[q.category]}
                                      </Badge>
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setSelectedQuestion(q);
                                      setAnswerText(q.answer || "");
                                    }}
                                    data-testid={`button-answer-${q.id}`}
                                  >
                                    <Send className="w-4 h-4 mr-2" />
                                    Answer
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {answeredQuestions.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            Answered ({answeredQuestions.length})
                          </Badge>
                        </h3>
                        <div className="space-y-4">
                          {answeredQuestions.map((q) => (
                            <Card key={q.id} className="border-blue-200" data-testid={`card-question-${q.id}`}>
                              <CardContent className="pt-4">
                                <div className="flex justify-between items-start gap-4 mb-3">
                                  <div className="flex-1">
                                    <p className="font-medium text-foreground mb-2">{q.question}</p>
                                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{q.answer}</p>
                                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                                      <span>{q.name}</span>
                                      <span>•</span>
                                      <Badge className={`text-xs ${categoryColors[q.category]}`}>
                                        {categoryLabels[q.category]}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedQuestion(q);
                                        setAnswerText(q.answer || "");
                                      }}
                                      data-testid={`button-edit-${q.id}`}
                                    >
                                      Edit
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => publishMutation.mutate(q.id)}
                                      disabled={publishMutation.isPending}
                                      data-testid={`button-publish-${q.id}`}
                                    >
                                      <BookOpen className="w-4 h-4 mr-2" />
                                      Publish to FAQ
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {publishedQuestions.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Published ({publishedQuestions.length})
                          </Badge>
                        </h3>
                        <div className="space-y-4">
                          {publishedQuestions.map((q) => (
                            <Card key={q.id} className="border-green-200 bg-green-50/30 dark:bg-green-900/10" data-testid={`card-question-${q.id}`}>
                              <CardContent className="pt-4">
                                <div className="flex justify-between items-start gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Check className="w-4 h-4 text-green-600" />
                                      <p className="font-medium text-foreground">{q.question}</p>
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-2">{q.answer}</p>
                                  </div>
                                  <Badge className={`text-xs ${categoryColors[q.category]}`}>
                                    {categoryLabels[q.category]}
                                  </Badge>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="faqs">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      Published Dynamic FAQs
                    </CardTitle>
                    <CardDescription>
                      FAQs published from community questions - these appear in the FAQ section
                    </CardDescription>
                  </div>
                  <Button onClick={() => setShowNewFaqDialog(true)} data-testid="button-add-faq">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Add New FAQ
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {faqsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-muted-foreground">Loading FAQs...</p>
                  </div>
                ) : !dynamicFaqs || dynamicFaqs.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground text-lg mb-2">No published FAQs yet</p>
                    <p className="text-sm text-muted-foreground">
                      Answer community questions and publish them here, or create new FAQs directly.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dynamicFaqs.map((faq) => (
                      <Card key={faq.id} data-testid={`card-faq-${faq.id}`}>
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <p className="font-medium text-foreground">{faq.question}</p>
                                {faq.isNew && (
                                  <Badge className="text-xs bg-primary/10 text-primary">
                                    <Sparkles className="w-3 h-3 mr-1" />
                                    New
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{faq.answer}</p>
                              <div className="flex items-center gap-2">
                                <Badge className={`text-xs ${categoryColors[faq.category]}`}>
                                  {categoryLabels[faq.category]}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {faq.viewCount} views
                                </span>
                              </div>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                if (confirm("Are you sure you want to delete this FAQ?")) {
                                  deleteFaqMutation.mutate(faq.id);
                                }
                              }}
                              data-testid={`button-delete-faq-${faq.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="searches">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-4 flex-wrap">
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

              <div>
                <h3 className="text-lg font-semibold mb-4">Address Information</h3>
                <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                  <MapPin className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
                  <p className="font-medium break-words">{selectedParty.address}</p>
                </div>
              </div>

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

      {/* Answer Question Dialog */}
      <Dialog open={!!selectedQuestion} onOpenChange={(open) => !open && setSelectedQuestion(null)}>
        <DialogContent className="max-w-2xl" data-testid="dialog-answer-question">
          <DialogHeader>
            <DialogTitle>Answer Question</DialogTitle>
            <DialogDescription>
              Provide a helpful answer to this community question
            </DialogDescription>
          </DialogHeader>

          {selectedQuestion && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="font-medium text-foreground mb-2">{selectedQuestion.question}</p>
                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  <span>{selectedQuestion.name}</span>
                  <span>•</span>
                  <span>{selectedQuestion.email}</span>
                  <span>•</span>
                  <Badge className={`text-xs ${categoryColors[selectedQuestion.category]}`}>
                    {categoryLabels[selectedQuestion.category]}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Your Answer</label>
                <Textarea
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="Type your answer here..."
                  className="min-h-[150px]"
                  data-testid="textarea-answer"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setSelectedQuestion(null)}
                  data-testid="button-cancel-answer"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (selectedQuestion && answerText.trim().length >= 10) {
                      answerMutation.mutate({ id: selectedQuestion.id, answer: answerText });
                    }
                  }}
                  disabled={answerText.trim().length < 10 || answerMutation.isPending}
                  data-testid="button-save-answer"
                >
                  {answerMutation.isPending ? "Saving..." : "Save Answer"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New FAQ Dialog */}
      <Dialog open={showNewFaqDialog} onOpenChange={setShowNewFaqDialog}>
        <DialogContent className="max-w-2xl" data-testid="dialog-new-faq">
          <DialogHeader>
            <DialogTitle>Add New FAQ</DialogTitle>
            <DialogDescription>
              Create a new FAQ entry directly (not from a community question)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select value={newFaqCategory} onValueChange={setNewFaqCategory}>
                <SelectTrigger data-testid="select-new-faq-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Question</label>
              <Input
                value={newFaqQuestion}
                onChange={(e) => setNewFaqQuestion(e.target.value)}
                placeholder="Enter the FAQ question..."
                data-testid="input-new-faq-question"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Answer</label>
              <Textarea
                value={newFaqAnswer}
                onChange={(e) => setNewFaqAnswer(e.target.value)}
                placeholder="Enter the FAQ answer..."
                className="min-h-[150px]"
                data-testid="textarea-new-faq-answer"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowNewFaqDialog(false)}
                data-testid="button-cancel-new-faq"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (newFaqQuestion.trim().length >= 10 && newFaqAnswer.trim().length >= 10) {
                    createFaqMutation.mutate({
                      question: newFaqQuestion,
                      answer: newFaqAnswer,
                      category: newFaqCategory,
                    });
                  }
                }}
                disabled={
                  newFaqQuestion.trim().length < 10 || 
                  newFaqAnswer.trim().length < 10 || 
                  createFaqMutation.isPending
                }
                data-testid="button-create-faq"
              >
                {createFaqMutation.isPending ? "Creating..." : "Create FAQ"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
