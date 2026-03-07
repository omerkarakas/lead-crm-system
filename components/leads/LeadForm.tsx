"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LeadStatus, LeadSource } from "@/types/lead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Plus, Loader2, AlertTriangle } from "lucide-react";
import { useState } from "react";

// Türkiye cep telefonu validasyonu (10-12 hane, otomatik formatlanır)
const turkishPhoneSchema = z
  .string()
  .min(10, "Telefon numarası en az 10 haneli olmalıdır")
  .max(12, "Telefon numarası en fazla 12 haneli olmalıdır")
  .regex(/^\d{10,12}$/, "Geçerli bir Türkiye cep telefon numarası girin")
  .transform((val) => {
    // 10 hane ise başına 90 ekle
    if (val.length === 10) {
      return "90" + val;
    }
    // 11 hane ise ve 0 ile başlıyorsa, başına 9 ekle
    if (val.length === 11 && val.startsWith("0")) {
      return "9" + val.substring(1);
    }
    return val;
  })
  .refine((val) => val.length === 12 && val.startsWith("90"), {
    message: "Geçerli bir Türkiye cep telefon numarası girin (örn: 905551234567)",
  });

const leadFormSchema = z
  .object({
    name: z.string().min(2, "İsim en az 2 karakter olmalıdır"),
    phone: turkishPhoneSchema,
    email: z.string().email("Geçerli bir e-posta adresi girin").optional().or(z.literal("")),
    company: z.string().min(2, "Şirket adı en az 2 karakter olmalıdır"),
    website: z.string().optional(),
    message: z.string().optional(),
    source: z.nativeEnum(LeadSource, { required_error: "Lütfen bir kaynak seçin" }),
    status: z.nativeEnum(LeadStatus, { required_error: "Lütfen bir durum seçin" }),
    tags: z.array(z.string()).default([]),
  })
  .refine(
    (data) => {
      // Website boşsa geç
      if (!data.website || data.website.trim() === "") {
        return true;
      }
      // Protokol yoksa ekle ve kontrol et
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

interface LeadFormProps {
  onSubmit: (data: LeadFormValues, force?: boolean) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  defaultValues?: Partial<LeadFormValues> & { auto_updated_status?: boolean };
  mode?: "create" | "edit";
  userRole?: 'admin' | 'sales' | 'marketing';
}

const STATUS_LABELS: Record<LeadStatus, string> = {
  [LeadStatus.NEW]: "Yeni",
  [LeadStatus.QUALIFIED]: "Uygun",
  [LeadStatus.BOOKED]: "Randevu",
  [LeadStatus.CUSTOMER]: "Müşteri",
  [LeadStatus.LOST]: "Kayıp",
  [LeadStatus.RE_APPLY]: "Tekrar Başvuru",
};

const SOURCE_LABELS: Record<LeadSource, string> = {
  [LeadSource.WEB_FORM]: "Web Formu",
  [LeadSource.API]: "API",
  [LeadSource.MANUAL]: "Manuel",
  [LeadSource.WHATSAPP]: "WhatsApp",
};

export function LeadForm({ onSubmit, onCancel, isSubmitting = false, defaultValues, mode = "create", userRole = 'sales' }: LeadFormProps) {
  const [tagInput, setTagInput] = useState("");
  const [forceOverride, setForceOverride] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus | undefined>(defaultValues?.status);
  const isAutoUpdated = defaultValues?.auto_updated_status === true;
  const isAdmin = userRole === 'admin';

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      company: "",
      website: "",
      message: "",
      source: LeadSource.MANUAL,
      status: LeadStatus.NEW,
      tags: [],
      ...defaultValues,
    },
  });

  const {
    fields: tagsFields,
    append: appendTag,
    remove: removeTag,
  } = {
    fields: form.watch("tags").map((tag, index) => ({ id: index.toString(), value: tag })),
    append: (tag: string) => form.setValue("tags", [...form.getValues("tags"), tag]),
    remove: (index: number) => {
      const currentTags = form.getValues("tags");
      form.setValue(
        "tags",
        currentTags.filter((_, i) => i !== index),
      );
    },
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !form.getValues("tags").includes(tag)) {
      appendTag(tag);
      setTagInput("");
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async (data: LeadFormValues) => {
    await onSubmit(data, forceOverride);
  };

  const handleStatusChange = (newStatus: LeadStatus) => {
    setSelectedStatus(newStatus);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                <FormLabel>Cep Telefonu *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="0555 123 4567"
                    maxLength={12}
                    {...field}
                    onChange={(e) => {
                      // Sadece rakamları tut
                      const cleaned = e.target.value.replace(/\D/g, "");
                      field.onChange(cleaned);
                    }}
                    value={field.value}
                  />
                </FormControl>
                <FormDescription>
                  10 hane (5551234567) veya 12 hane (905551234567) şeklinde girebilirsiniz
                </FormDescription>
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
                  <Input placeholder="ahmet@example.com" {...field} />
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
                <FormLabel>Şirket</FormLabel>
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
                <Input placeholder="google.com veya https://www.example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="source"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kaynak *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Kaynak seçin" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(SOURCE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Durum *</FormLabel>
                {isAutoUpdated && (
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-amber-800 font-medium">
                          ⚠️ Bu statü otomatik güncellendi (teklif cevabı)
                        </p>
                        {isAdmin ? (
                          <p className="text-xs text-amber-700 mt-1">
                            Değiştirmek için aşağıdaki "Zorla" checkbox'unu işaretleyin.
                          </p>
                        ) : (
                          <p className="text-xs text-amber-700 mt-1">
                            Sadece admin bu statüyü değiştirebilir.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    handleStatusChange(value as LeadStatus);
                  }}
                  defaultValue={field.value}
                  disabled={isAutoUpdated && !isAdmin}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Durum seçin" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isAutoUpdated && isAdmin && (
                  <div className="flex items-center gap-2 mt-2">
                    <Checkbox
                      id="force-override"
                      checked={forceOverride}
                      onCheckedChange={(checked) => setForceOverride(checked === true)}
                    />
                    <label
                      htmlFor="force-override"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Zorla (Manuel değiştir)
                    </label>
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="tags"
          render={() => (
            <FormItem>
              <FormLabel>Etiketler</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input
                    placeholder="Etiket ekle..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                  />
                </FormControl>
                <Button type="button" variant="outline" size="icon" onClick={handleAddTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {form.watch("tags").map((tag, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(index)}
                      className="hover:bg-destructive/20 rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <FormDescription>Enter tuşuna basarak etiket ekleyebilirsiniz</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mesaj</FormLabel>
              <FormControl>
                <Textarea placeholder="Lead hakkında notlar..." className="min-h-[100px]" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            İptal
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "create" ? "Lead Oluştur" : "Değişiklikleri Kaydet"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
