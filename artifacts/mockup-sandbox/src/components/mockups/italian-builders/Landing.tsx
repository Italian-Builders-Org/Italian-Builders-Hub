import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Menu, X, ArrowRight, Github, Twitter, CheckCircle2, ChevronRight, Zap } from "lucide-react";
import "./Landing.css";

// --- Mock Data ---

const CATEGORIES = [
  "AI", "SaaS", "B2B", "B2C", "Crypto", "Open Source", 
  "DevTools", "Consumer Apps", "Automation", "Design", "No-Code", "Mobile Apps"
];

const OS_PROJECTS = [
  {
    title: "Italian Builders Directory",
    description: "An open directory to discover active builders, products, and startups in the ecosystem.",
    status: "Coming soon",
    action: "Suggest idea",
    statusColor: "bg-blue-100 text-blue-700 border-blue-200"
  },
  {
    title: "Builder Profile Pages",
    description: "Public pages showcasing your projects, contributions, and builder journey.",
    status: "In discussion",
    action: "Join waitlist",
    statusColor: "bg-orange-100 text-orange-700 border-orange-200"
  },
  {
    title: "Project Showcase",
    description: "A centralized hub to launch, hunt, and vote on projects built by the community.",
    status: "Coming soon",
    action: "Suggest idea",
    statusColor: "bg-blue-100 text-blue-700 border-blue-200"
  },
  {
    title: "Resource Hub",
    description: "Playbooks, legal guides, and technical templates specifically for the Italian market.",
    status: "Open to contributors",
    action: "Suggest idea",
    statusColor: "bg-green-100 text-green-700 border-green-200"
  },
  {
    title: "Founder Matching",
    description: "Find technical or business co-founders with complementary skillsets.",
    status: "In discussion",
    action: "Join waitlist",
    statusColor: "bg-orange-100 text-orange-700 border-orange-200"
  },
  {
    title: "Perks & Discounts",
    description: "Exclusive deals on AWS, Vercel, Stripe, and other essential tools for members.",
    status: "Coming soon",
    action: "Suggest idea",
    statusColor: "bg-blue-100 text-blue-700 border-blue-200"
  }
];

const BUILDER_PROJECTS = [
  {
    name: "Supersync",
    category: "SaaS",
    description: "Automated bidirectional sync between Linear and GitHub issues.",
    builder: "Marco Rossi",
    status: "Revenue",
    statusColor: "bg-green-100 text-green-700",
    image: "/__mockup/images/project-1.png",
    avatar: "/__mockup/images/avatar-1.png"
  },
  {
    name: "Lumina AI",
    category: "AI",
    description: "Generative UI components from simple text prompts.",
    builder: "Sofia Bianchi",
    status: "Beta",
    statusColor: "bg-purple-100 text-purple-700",
    image: "/__mockup/images/project-2.png",
    avatar: "/__mockup/images/avatar-2.png"
  },
  {
    name: "BaseLayer",
    category: "DevTools",
    description: "Postgres database branching for instant preview environments.",
    builder: "Luca Ferrari",
    status: "Live",
    statusColor: "bg-blue-100 text-blue-700",
    image: "/__mockup/images/project-3.png",
    avatar: "/__mockup/images/avatar-3.png"
  },
  {
    name: "Nexus",
    category: "B2B",
    description: "CRM for specialized independent consulting agencies.",
    builder: "Giulia Romano",
    status: "MVP",
    statusColor: "bg-yellow-100 text-yellow-700",
    image: "/__mockup/images/project-4.png",
    avatar: "/__mockup/images/avatar-4.png"
  },
  {
    name: "CryptFlow",
    category: "Crypto",
    description: "Fiat-to-crypto onramp API for European merchants.",
    builder: "Alessandro Conti",
    status: "Revenue",
    statusColor: "bg-green-100 text-green-700",
    image: "/__mockup/images/project-5.png",
    avatar: "/__mockup/images/avatar-5.png"
  },
  {
    name: "OpenStore",
    category: "Open Source",
    description: "Self-hosted alternative to Shopify for digital creators.",
    builder: "Elena Marino",
    status: "Beta",
    statusColor: "bg-purple-100 text-purple-700",
    image: "/__mockup/images/project-6.png",
    avatar: "/__mockup/images/avatar-6.png"
  }
];

const FEATURES = [
  { title: "Builder profiles", description: "Showcase your work, stack, and current focus." },
  { title: "Project pages", description: "Dedicated spaces to launch and gather feedback." },
  { title: "Video introductions", description: "Short asynchronous intros to build trust." },
  { title: "Category-based discovery", description: "Find peers by niche, from AI to Crypto." },
  { title: "Open-source projects", description: "Contribute to shared community infrastructure." },
  { title: "Founder matching", description: "Find the right partner for your next venture." },
  { title: "Resources and playbooks", description: "Curated knowledge from successful operators." },
  { title: "Member perks", description: "Software discounts to extend your runway." }
];

const WHO_FOR = [
  {
    title: "Builders",
    description: "For people building apps, products, startups, and tools.",
    icon: "🔨"
  },
  {
    title: "Contributors",
    description: "For developers, designers, marketers, operators, and makers who want to collaborate.",
    icon: "🤝"
  },
  {
    title: "Supporters",
    description: "For mentors, advisors, and people who want to help the ecosystem grow.",
    icon: "🌱"
  },
  {
    title: "Investors & Talent Scouts",
    description: "For people looking for early projects, promising builders, and emerging talent.",
    icon: "👀"
  }
];

const ROLES = [
  "Builder", "Developer", "Designer", "Founder", "Investor", "Student", "Supporter", "Other"
];

// --- Components ---

function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center">
            <span className="text-white font-display font-bold text-sm">IB</span>
          </div>
          <span className="font-display font-semibold text-lg tracking-tight">Italian Builders</span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <a href="#builders" className="text-sm font-medium text-gray-600 hover:text-zinc-900 transition-colors">Builders</a>
          <a href="#projects" className="text-sm font-medium text-gray-600 hover:text-zinc-900 transition-colors">Projects</a>
          <a href="#os-projects" className="text-sm font-medium text-gray-600 hover:text-zinc-900 transition-colors">OS Projects</a>
          <a href="#manifesto" className="text-sm font-medium text-gray-600 hover:text-zinc-900 transition-colors">Manifesto</a>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <a href="#join" className="text-sm font-medium text-gray-600 hover:text-zinc-900">Sign in</a>
          <Button className="bg-zinc-900 text-white hover:bg-zinc-800 rounded-full px-6">
            Join waitlist
          </Button>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden p-2 text-zinc-600"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-4">
          <nav className="flex flex-col space-y-3">
            <a href="#builders" className="text-base font-medium text-gray-600">Builders</a>
            <a href="#projects" className="text-base font-medium text-gray-600">Projects</a>
            <a href="#os-projects" className="text-base font-medium text-gray-600">OS Projects</a>
            <a href="#manifesto" className="text-base font-medium text-gray-600">Manifesto</a>
          </nav>
          <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
            <Button variant="outline" className="w-full justify-center">Sign in</Button>
            <Button className="w-full justify-center bg-zinc-900 text-white hover:bg-zinc-800">
              Join waitlist
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}

function HeroGrid() {
  return (
    <div className="hero-grid absolute inset-0 -z-10 w-[120%] -left-[10%] h-[150%] pointer-events-none select-none overflow-hidden">
      {/* Column 1 */}
      <div className="hero-grid-column animate-marquee">
        {[1, 2, 3, 4].map((i) => (
          <div key={`c1-${i}`} className="glass-card rounded-2xl p-4 flex flex-col gap-3 h-48 w-64">
             <div className="flex gap-3 items-center">
               <div className="w-10 h-10 rounded-full bg-gray-200" />
               <div className="space-y-1">
                 <div className="h-3 w-24 bg-gray-200 rounded-full" />
                 <div className="h-2 w-16 bg-gray-100 rounded-full" />
               </div>
             </div>
             <div className="h-20 bg-gray-100 rounded-xl w-full mt-2" />
          </div>
        ))}
      </div>
      
      {/* Column 2 */}
      <div className="hero-grid-column animate-marquee" style={{ animationDelay: '-15s', animationDuration: '40s' }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={`c2-${i}`} className="glass-card rounded-2xl p-4 flex flex-col justify-between h-56 w-72">
             <div className="h-24 bg-gray-100 rounded-xl w-full" />
             <div className="space-y-2 mt-4">
                 <div className="h-3 w-32 bg-gray-200 rounded-full" />
                 <div className="h-2 w-full bg-gray-100 rounded-full" />
                 <div className="h-2 w-4/5 bg-gray-100 rounded-full" />
             </div>
          </div>
        ))}
      </div>

      {/* Column 3 */}
      <div className="hero-grid-column animate-marquee" style={{ animationDelay: '-5s' }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={`c3-${i}`} className="glass-card rounded-2xl p-4 flex flex-col gap-3 h-40 w-64">
             <div className="flex justify-between items-start">
                <Badge variant="secondary" className="bg-gray-100 text-transparent">Badge</Badge>
                <div className="w-6 h-6 rounded-full bg-gray-100" />
             </div>
             <div className="space-y-2 mt-auto">
                 <div className="h-4 w-28 bg-gray-200 rounded-full" />
                 <div className="h-2 w-full bg-gray-100 rounded-full" />
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden pt-24 pb-32 md:pt-32 md:pb-40">
      <HeroGrid />
      
      {/* Gradient overlay to fade edges of the grid */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/60 to-white pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-white pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl">
        <Badge variant="outline" className="mb-6 py-1.5 px-4 bg-white/50 backdrop-blur-sm border-gray-200 text-zinc-600 font-medium">
          <Zap size={14} className="mr-2 text-yellow-500 fill-yellow-500" />
          The home for Italian builders.
        </Badge>
        
        <h1 className="text-5xl md:text-7xl font-bold font-display tracking-tight text-zinc-900 mb-6 leading-[1.1]">
          Where Italian builders <br className="hidden md:block" /> come to <span className="gradient-text">build in public.</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-zinc-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          A community for people building apps, AI tools, SaaS products, open-source projects, and internet businesses from Italy.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <Button size="lg" className="w-full sm:w-auto h-14 px-8 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white text-lg shadow-xl shadow-zinc-200">
            Join the waitlist
          </Button>
          <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 rounded-full border-gray-300 text-zinc-700 hover:bg-gray-50 text-lg bg-white/80 backdrop-blur-sm">
            Explore what's coming
          </Button>
        </div>
        
        <div className="flex items-center justify-center gap-3 text-sm text-zinc-500 font-medium">
          <div className="flex -space-x-2">
            <img src="/__mockup/images/avatar-1.png" className="w-8 h-8 rounded-full border-2 border-white" alt="Builder" />
            <img src="/__mockup/images/avatar-2.png" className="w-8 h-8 rounded-full border-2 border-white" alt="Builder" />
            <img src="/__mockup/images/avatar-3.png" className="w-8 h-8 rounded-full border-2 border-white" alt="Builder" />
            <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs text-gray-500">+</div>
          </div>
          <p>240+ builders joined in the first 48 hours.</p>
        </div>
      </div>
    </section>
  );
}

function CategoryStrip() {
  return (
    <div className="w-full overflow-hidden py-6 border-y border-gray-100 bg-white relative">
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent z-10" />
      
      <div className="flex gap-3 px-4 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap items-center">
        {CATEGORIES.map((cat, i) => (
          <button 
            key={i} 
            className="px-5 py-2.5 rounded-full border border-gray-200 bg-gray-50 text-gray-700 font-medium text-sm hover:bg-gray-100 hover:border-gray-300 transition-all flex-shrink-0"
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}

function OSProjects() {
  return (
    <section id="os-projects" className="py-24 bg-zinc-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-2xl mb-12">
          <h2 className="text-3xl md:text-4xl font-bold font-display text-zinc-900 mb-4">Community OS projects</h2>
          <p className="text-lg text-zinc-600">Open projects built by and for the Italian Builders community.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {OS_PROJECTS.map((project, i) => (
            <Card key={i} className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col h-full rounded-2xl">
              <div className="mb-4 flex justify-between items-start gap-4">
                <h3 className="font-bold text-lg text-zinc-900 leading-tight">{project.title}</h3>
                <Badge variant="outline" className={`font-medium whitespace-nowrap ${project.statusColor}`}>
                  {project.status}
                </Badge>
              </div>
              <p className="text-zinc-600 text-sm mb-8 flex-grow">{project.description}</p>
              
              <Button variant="ghost" className="w-full mt-auto rounded-xl border-gray-200 hover:bg-gray-50 text-zinc-700 font-medium group">
                {project.action}
                <ArrowRight size={16} className="ml-2 text-zinc-400 group-hover:text-zinc-700 transition-colors" />
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function BuilderProjects() {
  return (
    <section id="projects" className="py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold font-display text-zinc-900 mb-4">Projects from the community</h2>
            <p className="text-lg text-zinc-600">Apps, tools, experiments, startups, and side projects from Italian builders.</p>
          </div>
          <p className="text-sm font-medium text-zinc-500 bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
            Real community projects will be added soon.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {BUILDER_PROJECTS.map((project, i) => (
            <div key={i} className="group rounded-2xl border border-gray-200 overflow-hidden hover:border-gray-300 hover:shadow-lg transition-all bg-white flex flex-col">
              {/* Image Container */}
              <div className="aspect-[4/3] w-full bg-gray-100 relative overflow-hidden">
                 <img src={project.image} alt={project.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                 <div className="absolute top-4 left-4">
                    <Badge className="bg-white/90 backdrop-blur-sm text-zinc-800 hover:bg-white border-none shadow-sm font-semibold">
                      {project.category}
                    </Badge>
                 </div>
              </div>
              
              {/* Content */}
              <div className="p-5 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-xl text-zinc-900">{project.name}</h3>
                  <Badge variant="outline" className={`${project.statusColor} border-transparent font-semibold`}>
                    {project.status}
                  </Badge>
                </div>
                <p className="text-zinc-600 text-sm mb-6 flex-grow line-clamp-2">{project.description}</p>
                
                {/* Builder Row */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <img src={project.avatar} alt={project.builder} className="w-8 h-8 rounded-full bg-gray-200" />
                  <span className="text-sm font-medium text-zinc-700">{project.builder}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhatsComing() {
  return (
    <section className="py-24 bg-zinc-900 text-white rounded-[2.5rem] mx-4 md:mx-6 lg:mx-8 mb-24 overflow-hidden relative">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-zinc-800 rounded-full blur-3xl opacity-50 translate-x-1/3 -translate-y-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-zinc-800 rounded-full blur-3xl opacity-50 -translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <div className="max-w-3xl mb-16">
          <Badge className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 mb-6 border-none">Platform vision</Badge>
          <h2 className="text-3xl md:text-5xl font-bold font-display mb-6 leading-tight">More than a Telegram group.</h2>
          <p className="text-lg md:text-xl text-zinc-400 leading-relaxed">
            Telegram is where the conversation happens. The website will become the place to discover builders, projects, opportunities, resources, and collaborations.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {FEATURES.map((feature, i) => (
            <div key={i} className="bg-zinc-800/50 backdrop-blur-sm border border-zinc-700/50 rounded-2xl p-6 hover:bg-zinc-800 transition-colors">
              <CheckCircle2 className="w-6 h-6 text-zinc-400 mb-4" />
              <h3 className="font-semibold text-white mb-2 text-lg">{feature.title}</h3>
              <p className="text-sm text-zinc-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhoFor() {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <h2 className="text-3xl md:text-4xl font-bold font-display text-center text-zinc-900 mb-16">Who is it for?</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {WHO_FOR.map((persona, i) => (
            <div key={i} className="p-8 rounded-3xl bg-gray-50 border border-gray-100 flex flex-col items-center text-center">
              <div className="text-4xl mb-6 bg-white w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm border border-gray-100">
                {persona.icon}
              </div>
              <h3 className="font-bold text-xl text-zinc-900 mb-3">{persona.title}</h3>
              <p className="text-zinc-600 text-sm leading-relaxed">{persona.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Waitlist() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [formData, setFormData] = useState({ name: "", email: "", role: "", building: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    // Mock API call
    setTimeout(() => {
      setStatus("success");
    }, 1000);
  };

  return (
    <section id="join" className="py-32 bg-gray-50 border-t border-gray-100 relative">
      {/* Pattern background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />

      <div className="container mx-auto px-4 md:px-6 max-w-2xl relative z-10">
        <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 p-8 md:p-12">
          
          {status === "success" ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold font-display text-zinc-900 mb-4">You're on the list.</h2>
              <p className="text-lg text-zinc-600">We'll keep you posted. In the meantime, join the conversation on Telegram.</p>
              <Button className="mt-8 rounded-full px-8 bg-[#0088cc] hover:bg-[#0077b5] text-white">
                Join Telegram
              </Button>
            </div>
          ) : (
            <>
              <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-bold font-display text-zinc-900 mb-4">Join the waitlist</h2>
                <p className="text-lg text-zinc-600">Leave your email to be notified when the Italian Builders platform goes live.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-900">Name</label>
                    <Input 
                      required 
                      placeholder="Mario Rossi" 
                      className="h-12 bg-gray-50 border-gray-200 focus-visible:ring-zinc-900 rounded-xl"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-900">Email</label>
                    <Input 
                      required 
                      type="email" 
                      placeholder="mario@example.com" 
                      className="h-12 bg-gray-50 border-gray-200 focus-visible:ring-zinc-900 rounded-xl"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-900">I am a...</label>
                  <Select value={formData.role} onValueChange={v => setFormData({...formData, role: v})}>
                    <SelectTrigger className="h-12 bg-gray-50 border-gray-200 focus-visible:ring-zinc-900 rounded-xl">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map(role => (
                        <SelectItem key={role} value={role}>{role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-900">What are you building? <span className="text-zinc-400 font-normal">(Optional)</span></label>
                  <Input 
                    placeholder="Link to project, short description, or 'looking for ideas'" 
                    className="h-12 bg-gray-50 border-gray-200 focus-visible:ring-zinc-900 rounded-xl"
                    value={formData.building}
                    onChange={e => setFormData({...formData, building: e.target.value})}
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={status === "submitting"}
                  className="w-full h-14 text-lg rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white mt-4"
                >
                  {status === "submitting" ? "Joining..." : "Join the waitlist"}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-white py-12 border-t border-gray-200">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center">
              <span className="text-white font-display font-bold text-sm">IB</span>
            </div>
            <div>
              <span className="font-display font-semibold text-lg tracking-tight block leading-none">Italian Builders</span>
              <span className="text-sm text-zinc-500 mt-1 block">A community for people building from Italy.</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <a href="#" className="text-zinc-500 hover:text-zinc-900 font-medium text-sm transition-colors">Telegram</a>
            <a href="#" className="text-zinc-500 hover:text-zinc-900 font-medium text-sm transition-colors">X/Twitter</a>
            <a href="#" className="text-zinc-500 hover:text-zinc-900 font-medium text-sm transition-colors">GitHub</a>
            <a href="#" className="text-zinc-500 hover:text-zinc-900 font-medium text-sm transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// --- Main Page Component ---

export function Landing() {
  return (
    <div className="landing-container min-h-screen selection:bg-zinc-200">
      <Header />
      <main>
        <Hero />
        <CategoryStrip />
        <OSProjects />
        <BuilderProjects />
        <WhatsComing />
        <WhoFor />
        <Waitlist />
      </main>
      <Footer />
    </div>
  );
}
