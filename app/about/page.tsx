import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Shield, Users, TrendingUp, Award, Target, Heart, Globe, CheckCircle2 } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us - Swastika Infrastructures | Perfect Prosperity',
  description: 'Learn about Swastika Infrastructures and our founder Santosh Vishwakarma. We are committed to making land ownership accessible and transparent for every Indian with verified properties and trusted service.',
  openGraph: {
    title: 'About Swastika Infrastructures',
    description: 'Building Dreams, Creating Spaces - Your trusted partner in finding the perfect piece of land for your future.',
  },
};

export default function AboutPage() {
  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary/5 via-background to-success/5">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex justify-center mb-8">
              <Image
                src="/Swastika%20logo.png"
                alt="Swastika Infrastructures"
                width={120}
                height={120}
                className="h-24 w-24 md:h-32 md:w-32 object-contain"
                priority
              />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">About Swastika Infrastructures</h1>
            <p className="text-lg text-muted-foreground">
              Building Dreams, Creating Spaces - Your trusted partner in finding the perfect piece of land for your future.
            </p>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 bg-background">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Our Story</h2>
              <p className="text-lg text-muted-foreground">
                Transforming the real estate landscape with trust, transparency, and innovation
              </p>
            </div>
            <div className="prose prose-lg max-w-none text-muted-foreground">
              <p>
                Swastika Infrastructures was founded with a vision to revolutionize the way people buy and sell land in India. 
                We recognized the challenges faced by property seekers - lack of verified information, trustworthy agents, 
                and transparent processes. Our mission is to bridge this gap and make land transactions simple, secure, and accessible to everyone.
              </p>
              <p className="mt-4">
                With years of experience in the real estate industry, we have built a platform that connects genuine buyers 
                with verified property owners and trusted agents. Every listing on our platform goes through rigorous 
                verification to ensure authenticity and compliance with legal requirements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Founder Section */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Meet Our Founder</h2>
              <p className="text-lg text-muted-foreground">
                Visionary leadership driving innovation in real estate
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1">
                <div className="space-y-4">
                  <h3 className="font-display text-2xl md:text-3xl font-bold">Santosh Vishwakarma</h3>
                  <p className="text-xl text-primary font-semibold">Founder & CEO</p>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      Santosh Vishwakarma is a visionary entrepreneur with a deep passion for transforming the real estate 
                      industry in India. With over a decade of experience in property development and infrastructure projects, 
                      he founded Swastika Infrastructures with a mission to make land ownership accessible and transparent for every Indian.
                    </p>
                    <p>
                      Under his leadership, Swastika Infrastructures has grown from a small startup to a trusted name in 
                      real estate, serving thousands of satisfied customers across India. His commitment to ethical business 
                      practices, customer satisfaction, and innovation has been the cornerstone of the company's success.
                    </p>
                    <p>
                      "Our goal is not just to sell land, but to help people build their dreams. Every plot we offer represents 
                      someone's future home, business, or investment. That responsibility drives everything we do at Swastika Infrastructures." 
                      - Santosh Vishwakarma
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="order-1 md:order-2">
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl">
                  <Image
                    src="/About.png"
                    alt="Santosh Vishwakarma - Founder & CEO"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '500+', label: 'Properties Listed' },
              { value: '1000+', label: 'Happy Customers' },
              { value: '50+', label: 'Cities Covered' },
              { value: '200+', label: 'Verified Plots' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="font-display text-4xl md:text-5xl font-bold mb-2">{stat.value}</div>
                <div className="text-primary-foreground/80">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-16 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Our Core Values</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The principles that guide every decision we make
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { 
                icon: Shield, 
                title: 'Trust & Transparency', 
                description: 'Every property is verified and all information is transparent. We believe in building long-term relationships based on trust.' 
              },
              { 
                icon: Heart, 
                title: 'Customer First', 
                description: 'Your dreams and goals are our priority. We go above and beyond to ensure your satisfaction and success.' 
              },
              { 
                icon: Target, 
                title: 'Excellence', 
                description: 'We strive for excellence in everything we do, from property verification to customer service and after-sales support.' 
              },
            ].map((value, i) => (
              <div key={i} className="bg-card rounded-xl p-8 shadow-sm border hover:shadow-md transition-shadow">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <value.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-3">{value.title}</h3>
                <p className="text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Why Choose Swastika Infrastructures?</h2>
              <p className="text-lg text-muted-foreground">
                We make your property journey seamless and secure
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-6">
              {[
                'Verified property listings with complete documentation',
                'Expert guidance from experienced real estate professionals',
                'Transparent pricing with no hidden charges',
                'Legal compliance and documentation support',
                'Wide range of properties across multiple locations',
                'Post-purchase support and assistance',
                'Secure online platform for property search',
                'Flexible payment options and financing assistance',
              ].map((feature, i) => (
                <div key={i} className="flex gap-3">
                  <CheckCircle2 className="h-6 w-6 text-success shrink-0 mt-0.5" />
                  <p className="text-muted-foreground">{feature}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Ready to Start Your Journey?</h2>
          <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto text-lg">
            Join thousands of satisfied customers who found their dream property through Swastika Infrastructures. 
            Let us help you find the perfect plot for your future.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/plots">
              <Button size="lg" variant="secondary" className="gap-2">
                Browse Properties
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="border-primary-foreground/30 text-black hover:bg-primary-foreground/10 bg-white/90">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
