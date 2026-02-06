"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  AlertTriangle,
  Sparkles,
  Zap,
  Heart,
  Star
} from "lucide-react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/layout/page-header";

export default function UIShowcasePage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="UI Component Showcase"
        description="Explore all the beautiful components available in this template"
      />

      {/* Buttons Section */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Buttons</CardTitle>
          <CardDescription>Different button styles and variants</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
          </div>

          <Separator />

          <div className="flex flex-wrap gap-4">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
          </div>

          <Separator />

          <div className="flex flex-wrap gap-4">
            <Button className="bg-gradient-primary hover-glow-primary">
              Gradient Primary
            </Button>
            <Button className="bg-gradient-secondary hover-glow-primary">
              Gradient Secondary
            </Button>
            <Button className="bg-gradient-accent hover-glow-primary">
              Gradient Accent
            </Button>
            <Button className="bg-gradient-primary shine">
              With Shine Effect
            </Button>
          </div>

          <Separator />

          <div className="flex flex-wrap gap-4">
            <Button disabled>Disabled</Button>
            <Button>
              <Sparkles className="mr-2 h-4 w-4" />
              With Icon
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Badges Section */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Badges</CardTitle>
          <CardDescription>Status indicators and labels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Section */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Alerts</CardTitle>
          <CardDescription>Informative messages for users</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Info</AlertTitle>
            <AlertDescription>
              This is an informational alert message.
            </AlertDescription>
          </Alert>

          <Alert className="border-green-500/50 text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>
              Your action was completed successfully!
            </AlertDescription>
          </Alert>

          <Alert className="border-yellow-500/50 text-yellow-600 dark:text-yellow-400">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              Please review this important information.
            </AlertDescription>
          </Alert>

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Something went wrong. Please try again.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Cards Section */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass hover-glow-primary">
          <CardHeader>
            <div className="bg-gradient-primary h-10 w-10 rounded-lg flex items-center justify-center mb-2">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <CardTitle>Glass Card</CardTitle>
            <CardDescription>With glassmorphism effect</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Beautiful glass card with hover glow effect.
            </p>
          </CardContent>
        </Card>

        <Card className="gradient-border">
          <CardHeader>
            <div className="bg-gradient-secondary h-10 w-10 rounded-lg flex items-center justify-center mb-2">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <CardTitle>Gradient Border</CardTitle>
            <CardDescription>Animated gradient border</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Card with animated gradient border effect.
            </p>
          </CardContent>
        </Card>

        <Card className="glass-strong pulse-glow">
          <CardHeader>
            <div className="bg-gradient-accent h-10 w-10 rounded-lg flex items-center justify-center mb-2">
              <Star className="h-5 w-5 text-white" />
            </div>
            <CardTitle>Pulse Glow</CardTitle>
            <CardDescription>With pulsing glow animation</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Strong glass effect with pulse glow.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress & Sliders */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Progress & Sliders</CardTitle>
          <CardDescription>Visual indicators for values</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress (45%)</span>
              <span className="text-muted-foreground">45/100</span>
            </div>
            <Progress value={45} />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress (80%)</span>
              <span className="text-muted-foreground">80/100</span>
            </div>
            <Progress value={80} className="h-3" />
          </div>

          <Separator />

          <div className="space-y-2">
            <span className="text-sm">Slider</span>
            <Slider defaultValue={[50]} max={100} step={1} />
          </div>
        </CardContent>
      </Card>

      {/* Switches & Avatars */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="glass">
          <CardHeader>
            <CardTitle>Switches</CardTitle>
            <CardDescription>Toggle switches</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Enable notifications</span>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Dark mode</span>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Auto-save</span>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Avatars</CardTitle>
            <CardDescription>User profile pictures</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Avatar>
                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=John" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Jane" />
                <AvatarFallback>JS</AvatarFallback>
              </Avatar>
              <Avatar className="bg-gradient-primary">
                <AvatarFallback className="text-white">AB</AvatarFallback>
              </Avatar>
              <Avatar className="bg-gradient-secondary">
                <AvatarFallback className="text-white">CD</AvatarFallback>
              </Avatar>
              <Avatar className="bg-gradient-accent">
                <AvatarFallback className="text-white">EF</AvatarFallback>
              </Avatar>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Text Gradients */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Text Effects</CardTitle>
          <CardDescription>Gradient and animated text</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <h1 className="text-4xl font-bold text-gradient-primary">
            Gradient Primary Text
          </h1>
          <h2 className="text-3xl font-bold text-gradient-secondary">
            Gradient Secondary Text
          </h2>
          <h3 className="text-2xl font-bold text-gradient-accent">
            Gradient Accent Text
          </h3>
        </CardContent>
      </Card>

      {/* Animated Components */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Animated Components</CardTitle>
          <CardDescription>Motion and transitions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="glass-subtle rounded-lg p-6 cursor-pointer"
            >
              <div className="text-center">
                <div className="bg-gradient-primary h-12 w-12 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-semibold">Hover Scale</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Hover to see effect
                </p>
              </div>
            </motion.div>

            <motion.div
              className="glass-subtle rounded-lg p-6 float"
            >
              <div className="text-center">
                <div className="bg-gradient-secondary h-12 w-12 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-semibold">Floating</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Auto floating animation
                </p>
              </div>
            </motion.div>

            <div className="glass-subtle rounded-lg p-6 shine">
              <div className="text-center">
                <div className="bg-gradient-accent h-12 w-12 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-semibold">Shine Effect</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Continuous shine animation
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Background Effects */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-animated opacity-20" />
        <CardHeader className="relative z-10">
          <CardTitle>Background Effects</CardTitle>
          <CardDescription>Animated gradient background</CardDescription>
        </CardHeader>
        <CardContent className="relative z-10">
          <p className="text-sm text-muted-foreground">
            This card has an animated gradient background using the
            <code className="mx-1 px-2 py-1 rounded bg-muted">bg-gradient-animated</code>
            utility class.
          </p>
        </CardContent>
      </Card>

      {/* Utility Classes Reference */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Custom Utility Classes</CardTitle>
          <CardDescription>Available in globals.css</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 text-sm font-mono">
            <div className="grid grid-cols-2 gap-2">
              <code className="px-3 py-2 rounded bg-muted">.glass</code>
              <code className="px-3 py-2 rounded bg-muted">.glass-strong</code>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <code className="px-3 py-2 rounded bg-muted">.glass-subtle</code>
              <code className="px-3 py-2 rounded bg-muted">.bg-gradient-primary</code>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <code className="px-3 py-2 rounded bg-muted">.bg-gradient-secondary</code>
              <code className="px-3 py-2 rounded bg-muted">.bg-gradient-accent</code>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <code className="px-3 py-2 rounded bg-muted">.bg-gradient-animated</code>
              <code className="px-3 py-2 rounded bg-muted">.text-gradient-primary</code>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <code className="px-3 py-2 rounded bg-muted">.glow-primary</code>
              <code className="px-3 py-2 rounded bg-muted">.pulse-glow</code>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <code className="px-3 py-2 rounded bg-muted">.hover-glow-primary</code>
              <code className="px-3 py-2 rounded bg-muted">.shine</code>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <code className="px-3 py-2 rounded bg-muted">.float</code>
              <code className="px-3 py-2 rounded bg-muted">.gradient-border</code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
