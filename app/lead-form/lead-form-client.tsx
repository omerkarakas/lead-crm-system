"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, CheckCircle2 } from "lucide-react";

const leadFormSchema = z
  .object({
    name: z.string().min(2, "İsim en az 2 karakter olmalıdır"),
    phone: z.string().min(10, "Geçerli bir telefon numarası girin"),
    email: z.string().email("Geçerli bir e-posta adresi girin").optional().or(z.literal("")),
    company: z.string().min(2, "Şirket adı en az 2 karakter olmalıdır"),
    website: z.string().optional(),
    message: z.string().optional(),
    // Honeypot field - should always be empty
    fax_number: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.website || data.website.trim() === "") {
        return true;
      }
      let urlToCheck = data.website.trim();
      if (!urlToCheck.match(/^https?:\/\//i)) {
        urlToCheck = "https://" + urlToCheck;
      }
      try {
        new URL(urlToCheck);
        return true;
      } catch {
        return false;
      }
    },
    {
      message: "Geçerli bir website adresi girin (örn: google.com)",
      path: ["website"],
    },
  );

type LeadFormValues = z.infer<typeof leadFormSchema>;

interface UtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

export function LeadFormComponent() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [utmParams, setUtmParams] = useState<UtmParams>({});

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      company: "",
      website: "",
      message: "",
      fax_number: "",
    },
  });

  // Extract UTM parameters from URL on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const utm: UtmParams = {
        utm_source: urlParams.get("utm_source") || undefined,
        utm_medium: urlParams.get("utm_medium") || undefined,
        utm_campaign: urlParams.get("utm_campaign") || undefined,
        utm_content: urlParams.get("utm_content") || undefined,
        utm_term: urlParams.get("utm_term") || undefined,
      };
      setUtmParams(utm);
    }
  }, []);

  const onSubmit = async (data: LeadFormValues) => {
    // Honeypot check - if fax_number has a value, it's a bot
    if (data.fax_number && data.fax_number.trim() !== "") {
      // Return success anyway to not reveal the honeypot mechanism
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        form.reset();
      }, 3000);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          source: "web_form",
          status: "new",
          ...utmParams,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Bir hata oluştu");
      }

      setSubmitSuccess(true);
      form.reset();

      // Reset form after 3 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 5000);
    } catch (error) {
      console.error("Form submission error:", error);
      setSubmitError(error instanceof Error ? error.message : "Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="text-center py-12">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50 mb-2">Başvurunuz Alındı!</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">En kısa sürede sizinle iletişime geçeceğiz.</p>
        <Button
          onClick={() => {
            setSubmitSuccess(false);
            form.reset();
          }}
          variant="outline"
        >
          Yeni Başvuru
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ad Soyad *</FormLabel>
                <FormControl>
                  <Input placeholder="Ahmet Yılmaz" {...field} autoFocus />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefon *</FormLabel>
                <FormControl>
                  <Input placeholder="555 123 4567" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-posta</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="ahmet@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Şirket *</FormLabel>
                <FormControl>
                  <Input placeholder="Şirket A.Ş." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="website"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website</FormLabel>
              <FormControl>
                <Input placeholder="www.sirket.com.tr" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mesajınız</FormLabel>
              <FormControl>
                <Textarea placeholder="Bize kendinizden bahsedin..." className="min-h-[120px]" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Honeypot field - hidden from users but visible to bots */}
        <FormField
          control={form.control}
          name="fax_number"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <input
                  type="text"
                  {...field}
                  style={{
                    position: "absolute",
                    left: "-5000px",
                    opacity: 0,
                    height: 0,
                    width: 0,
                  }}
                  tabIndex={-1}
                  aria-hidden="true"
                  autoComplete="off"
                />
              </FormControl>
            </FormItem>
          )}
        />

        {submitError && (
          <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
            {submitError}
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Gönderiliyor..." : "Başvuru Gönder"}
          </Button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">* ile işaretlenen alanlar zorunludur</p>
      </form>
    </Form>
  );
}
