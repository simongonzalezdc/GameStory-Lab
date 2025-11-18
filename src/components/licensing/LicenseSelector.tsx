'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Copy, Download, Info, AlertCircle, Sparkles } from 'lucide-react';
import type { License, LicenseRecommendation } from '@/lib/generators/licensing';

interface LicenseSelectorProps {
  projectId: string;
  projectType?: 'library' | 'application' | 'saas' | 'utility';
  onLicenseSelected?: (licenseId: string, licenseText: string) => void;
}

export function LicenseSelector({ projectId, projectType = 'application', onLicenseSelected }: LicenseSelectorProps) {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [selectedLicense, setSelectedLicense] = useState<string>('');
  const [recommendation, setRecommendation] = useState<LicenseRecommendation | null>(null);
  const [isLoadingRecommendation, setIsLoadingRecommendation] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLicense, setGeneratedLicense] = useState<string>('');
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  // Form state for preferences
  const [preferences, setPreferences] = useState({
    projectType,
    allowCommercial: true,
    requireOpenSource: false,
    allowPatentUse: true,
    simplicityPreferred: false,
  });

  // Form state for license generation
  const [copyrightHolder, setCopyrightHolder] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());

  // Fetch all licenses
  useEffect(() => {
    fetchLicenses();
  }, []);

  const fetchLicenses = async () => {
    try {
      const response = await fetch('/api/licensing?action=list');
      const data = await response.json();
      if (data.success) {
        setLicenses(data.licenses);
      }
    } catch (error) {
      console.error('Failed to fetch licenses:', error);
    }
  };

  const getRecommendation = async () => {
    setIsLoadingRecommendation(true);
    try {
      const params = new URLSearchParams({
        action: 'recommend',
        projectType: preferences.projectType,
        allowCommercial: String(preferences.allowCommercial),
        requireOpenSource: String(preferences.requireOpenSource),
        allowPatentUse: String(preferences.allowPatentUse),
        simplicityPreferred: String(preferences.simplicityPreferred),
      });

      const response = await fetch(`/api/licensing?${params}`);
      const data = await response.json();

      if (data.success) {
        setRecommendation(data.recommendation);
        setSelectedLicense(data.recommendation.recommended.id);
      }
    } catch (error) {
      console.error('Failed to get recommendation:', error);
      alert('Failed to get license recommendation');
    } finally {
      setIsLoadingRecommendation(false);
    }
  };

  const generateLicenseText = async () => {
    if (!selectedLicense || !copyrightHolder.trim()) {
      alert('Please select a license and enter copyright holder name');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/licensing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          licenseId: selectedLicense,
          copyrightHolder: copyrightHolder.trim(),
          year,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedLicense(data.license.content);
        onLicenseSelected?.(data.license.licenseId, data.license.content);
        if (data.packageJsonUpdated) {
          alert(`License generated successfully! package.json has been updated with the ${data.license.name} license.`);
        } else {
          alert('License generated successfully!');
        }
      } else {
        alert(`Failed to generate license: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to generate license:', error);
      alert('Failed to generate license');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(type);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const handleDownload = (text: string, filename: string) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedLicenseData = licenses.find((l) => l.id === selectedLicense);

  const categoryColors = {
    permissive: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
    copyleft: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
    proprietary: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="assistant" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="assistant">
            <Sparkles className="h-4 w-4 mr-2" />
            License Assistant
          </TabsTrigger>
          <TabsTrigger value="browse">Browse All</TabsTrigger>
          <TabsTrigger value="generate">Generate LICENSE</TabsTrigger>
        </TabsList>

        {/* License Assistant Tab */}
        <TabsContent value="assistant" className="space-y-4">
          {/* Preferences Form */}
          <Card>
            <CardHeader>
              <CardTitle>Get License Recommendation</CardTitle>
              <CardDescription>Answer a few questions to find the perfect license for your project</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Project Type</Label>
                <RadioGroup
                  value={preferences.projectType}
                  onValueChange={(value) =>
                    setPreferences({ ...preferences, projectType: value as typeof preferences.projectType })
                  }
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="library" id="lib" />
                    <Label htmlFor="lib">Library/Package</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="application" id="app" />
                    <Label htmlFor="app">Application</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="saas" id="saas" />
                    <Label htmlFor="saas">SaaS/Web Service</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="utility" id="util" />
                    <Label htmlFor="util">Utility/Script</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="commercial"
                    checked={preferences.allowCommercial}
                    onChange={(e) => setPreferences({ ...preferences, allowCommercial: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="commercial">Allow commercial use</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="opensource"
                    checked={preferences.requireOpenSource}
                    onChange={(e) => setPreferences({ ...preferences, requireOpenSource: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="opensource">Require derivative works to be open source (copyleft)</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="patent"
                    checked={preferences.allowPatentUse}
                    onChange={(e) => setPreferences({ ...preferences, allowPatentUse: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="patent">Include patent protection</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="simple"
                    checked={preferences.simplicityPreferred}
                    onChange={(e) => setPreferences({ ...preferences, simplicityPreferred: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="simple">Prefer simple, short license</Label>
                </div>
              </div>

              <Button onClick={getRecommendation} disabled={isLoadingRecommendation} className="w-full">
                {isLoadingRecommendation ? 'Getting Recommendation...' : 'Get Recommendation'}
              </Button>
            </CardContent>
          </Card>

          {/* Recommendation Result */}
          {recommendation && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                  Recommended: {recommendation.recommended.name}
                </CardTitle>
                <CardDescription>
                  <Badge className={categoryColors[recommendation.recommended.category]}>
                    {recommendation.recommended.category}
                  </Badge>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Why this license?</h4>
                  <p className="text-sm text-muted-foreground">{recommendation.reasoning}</p>
                </div>

                {recommendation.warnings && recommendation.warnings.length > 0 && (
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <div className="flex gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-sm text-yellow-700 dark:text-yellow-400 mb-1">
                          Important Considerations
                        </h4>
                        {recommendation.warnings.map((warning, index) => (
                          <p key={index} className="text-sm text-yellow-700 dark:text-yellow-400">
                            {warning}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-medium mb-2">Permissions</h4>
                  <div className="flex flex-wrap gap-1">
                    {recommendation.recommended.permissions.map((perm) => (
                      <Badge key={perm} variant="outline" className="text-xs">
                        ✓ {perm}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Conditions</h4>
                  <div className="flex flex-wrap gap-1">
                    {recommendation.recommended.conditions.map((cond) => (
                      <Badge key={cond} variant="secondary" className="text-xs">
                        {cond}
                      </Badge>
                    ))}
                  </div>
                </div>

                {recommendation.alternatives.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Alternatives to consider</h4>
                    <div className="space-y-2">
                      {recommendation.alternatives.map((alt) => (
                        <div
                          key={alt.id}
                          className="p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80"
                          onClick={() => setSelectedLicense(alt.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{alt.name}</p>
                              <p className="text-xs text-muted-foreground">{alt.description}</p>
                            </div>
                            <Badge className={`${categoryColors[alt.category]} text-xs`}>{alt.category}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => setSelectedLicense(recommendation.recommended.id)}
                  variant="default"
                  className="w-full"
                >
                  Use {recommendation.recommended.name}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Browse All Tab */}
        <TabsContent value="browse" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Available Licenses</CardTitle>
              <CardDescription>Browse and compare popular open source licenses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {licenses.map((license) => (
                  <Card
                    key={license.id}
                    className={`cursor-pointer transition-all ${
                      selectedLicense === license.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedLicense(license.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{license.name}</CardTitle>
                          <CardDescription className="text-xs">{license.description}</CardDescription>
                        </div>
                        <Badge className={categoryColors[license.category]}>{license.category}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {license.permissions.slice(0, 3).map((perm) => (
                          <Badge key={perm} variant="outline" className="text-xs">
                            ✓ {perm}
                          </Badge>
                        ))}
                        {license.permissions.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{license.permissions.length - 3} more
                          </Badge>
                        )}
                      </div>

                      {license.popularProjects.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Used by: {license.popularProjects.slice(0, 3).join(', ')}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Generate LICENSE Tab */}
        <TabsContent value="generate" className="space-y-4">
          {selectedLicenseData && (
            <Card>
              <CardHeader>
                <CardTitle>Selected License: {selectedLicenseData.name}</CardTitle>
                <CardDescription>Fill in the details to generate your LICENSE file</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="copyright">Copyright Holder</Label>
                  <Input
                    id="copyright"
                    placeholder="Your Name or Organization"
                    value={copyrightHolder}
                    onChange={(e) => setCopyrightHolder(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value))}
                    className="mt-1"
                  />
                </div>

                <Button onClick={generateLicenseText} disabled={isGenerating} className="w-full">
                  {isGenerating ? 'Generating...' : 'Generate LICENSE File'}
                </Button>
              </CardContent>
            </Card>
          )}

          {!selectedLicenseData && (
            <Card>
              <CardContent className="pt-6 text-center">
                <Info className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Select a license from the Assistant or Browse tabs first</p>
              </CardContent>
            </Card>
          )}

          {generatedLicense && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Generated LICENSE File</CardTitle>
                  <CardDescription>Ready to add to your project</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleCopy(generatedLicense, 'license')}>
                    {copiedItem === 'license' ? (
                      <Check className="h-4 w-4 mr-2" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    {copiedItem === 'license' ? 'Copied!' : 'Copy'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDownload(generatedLicense, 'LICENSE')}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap">
                  {generatedLicense}
                </pre>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
