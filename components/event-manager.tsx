"use client";

import type React from "react";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Upload, X } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { DateTimePicker } from "@/components/date-time-picker";

interface EventRow {
  id: string;
  title: string;
  description: string | null;
  image_urls: string[] | null;
  price_per_entry: number;
  capacity: number | null;
  location: string | null;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

interface EventManagerProps {
  events: EventRow[];
}

export function EventManager({ events: initialEvents }: EventManagerProps) {
  const router = useRouter();
  const [events, setEvents] = useState<EventRow[]>(initialEvents);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventRow | null>(null);
  const [saving, setSaving] = useState(false);

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price_per_entry: "",
    capacity: "",
    location: "",
    is_active: true,
  });

  const [startsAt, setStartsAt] = useState<Date | null>(null);
  const [endsAt, setEndsAt] = useState<Date | null>(null);

  const setDateKeepingTime = (targetDate: Date, sourceTime: Date) => {
    const next = new Date(targetDate);
    next.setHours(sourceTime.getHours(), sourceTime.getMinutes(), sourceTime.getSeconds(), sourceTime.getMilliseconds());
    return next;
  };

  useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);

  useEffect(() => {
    // Enforce same-day end whenever both are present (covers editing existing rows too).
    if (!startsAt || !endsAt) return;
    const sameDay =
      startsAt.getFullYear() === endsAt.getFullYear() &&
      startsAt.getMonth() === endsAt.getMonth() &&
      startsAt.getDate() === endsAt.getDate();
    if (sameDay) return;
    setEndsAt(setDateKeepingTime(startsAt, endsAt));
  }, [startsAt, endsAt]);

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      price_per_entry: "",
      capacity: "",
      location: "",
      is_active: true,
    });
    setStartsAt(null);
    setEndsAt(null);
    setEditingEvent(null);
    setImageFiles([]);
    setImagePreviews([]);
    setExistingImageUrls([]);
  };

  const openEditDialog = (event: EventRow) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || "",
      price_per_entry: event.price_per_entry?.toString?.() ?? String(event.price_per_entry),
      capacity: typeof event.capacity === "number" ? String(event.capacity) : "",
      location: event.location || "",
      is_active: event.is_active,
    });
    setStartsAt(event.starts_at ? new Date(event.starts_at) : null);
    setEndsAt(event.ends_at ? new Date(event.ends_at) : null);
    setExistingImageUrls(event.image_urls || []);
    setImageFiles([]);
    setImagePreviews([]);
    setIsDialogOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        alert(`${file.name} is not an image file`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is too large (max 5MB)`);
        continue;
      }
      validFiles.push(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        if (newPreviews.length === validFiles.length) {
          setImagePreviews((prev) => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    }

    setImageFiles((prev) => [...prev, ...validFiles]);
  };

  const removeNewImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const supabase = createClient();
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `events/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage.from("event-images").upload(filePath, file);
      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("event-images").getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      return null;
    }
  };

  const uploadMultipleImages = async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map((file) => uploadImage(file));
    const results = await Promise.all(uploadPromises);
    return results.filter((url): url is string => url !== null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();

    try {
      if (!formData.title.trim()) {
        alert("Title is required");
        return;
      }

      if (!startsAt) {
        alert("Start date/time is required");
        return;
      }

      const price = Number.parseFloat(formData.price_per_entry);
      if (!Number.isFinite(price) || price < 0) {
        alert("Price per entry must be a valid number");
        return;
      }

      const startsAtIso = startsAt.toISOString();
      const endsAtIso = endsAt ? endsAt.toISOString() : null;
      if (endsAtIso && endsAt && endsAt.getTime() < startsAt.getTime()) {
        alert("End date/time must be after the start date/time");
        return;
      }

      let allImageUrls = [...existingImageUrls];
      if (imageFiles.length > 0) {
        const uploadedUrls = await uploadMultipleImages(imageFiles);
        if (uploadedUrls.length !== imageFiles.length) {
          alert("Some images failed to upload. Please try again.");
          return;
        }
        allImageUrls = [...allImageUrls, ...uploadedUrls];
      }

      const eventData = {
        title: formData.title.trim(),
        description: formData.description?.trim() ? formData.description.trim() : null,
        image_urls: allImageUrls.length > 0 ? allImageUrls : null,
        price_per_entry: price,
        capacity: formData.capacity.trim() ? Number.parseInt(formData.capacity, 10) : null,
        location: formData.location?.trim() ? formData.location.trim() : null,
        starts_at: startsAtIso,
        ends_at: endsAtIso,
        is_active: formData.is_active,
      };

      if (eventData.capacity !== null && !Number.isFinite(eventData.capacity)) {
        alert("Capacity must be a valid integer");
        return;
      }

      if (editingEvent) {
        const { error } = await supabase.from("events").update(eventData).eq("id", editingEvent.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("events").insert(eventData);
        if (error) throw error;
      }

      setIsDialogOpen(false);
      resetForm();
      router.refresh();
    } catch (error) {
      console.error("Error saving event:", error);
      alert("Failed to save event");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    const supabase = createClient();
    try {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
      setEvents((prev) => prev.filter((ev) => ev.id !== id));
      router.refresh();
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Failed to delete event");
    }
  };

  return (
    <div className="space-y-4">
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add New Event
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEvent ? "Edit Event" : "Add New Event"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price_per_entry">Price per entry</Label>
                <Input
                  id="price_per_entry"
                  type="number"
                  step="0.01"
                  required
                  value={formData.price_per_entry}
                  onChange={(e) => setFormData({ ...formData, price_per_entry: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="capacity">Capacity (optional)</Label>
                <Input
                  id="capacity"
                  type="number"
                  step="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Start date & time</Label>
              <DateTimePicker
                value={startsAt}
                onChange={(next: Date | null) => {
                  setStartsAt(next);
                  if (!next) {
                    setEndsAt(null);
                    return;
                  }
                  // Keep end on the same day as start (retain end time if already set).
                  setEndsAt((prev) => (prev ? setDateKeepingTime(next, prev) : prev));
                }}
              />
            </div>

            <div className="grid gap-2">
              <Label>End date & time (optional)</Label>
              <DateTimePicker
                value={endsAt}
                fixedDate={startsAt}
                placeholder="Pick an end time"
                onChange={(next: Date | null) => {
                  if (!next) {
                    setEndsAt(null);
                    return;
                  }
                  // Enforce same-day end: date comes from startsAt; time comes from user's selection.
                  if (startsAt) {
                    setEndsAt(setDateKeepingTime(startsAt, next));
                  } else {
                    setEndsAt(next);
                  }
                }}
                allowClear
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="location">Location (optional)</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="images">Event images</Label>

              {existingImageUrls.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {existingImageUrls.map((url, index) => (
                    <div key={`existing-${index}`} className="relative aspect-video rounded-lg overflow-hidden border">
                      <Image
                        src={url}
                        alt={`Existing ${index + 1}`}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover"
                        loading="lazy"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6"
                        onClick={() => removeExistingImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      {index === 0 && (
                        <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                          Primary
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {imagePreviews.map((preview, index) => (
                    <div key={`new-${index}`} className="relative aspect-video rounded-lg overflow-hidden border border-primary">
                      <Image
                        src={preview}
                        alt={`New ${index + 1}`}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover"
                        unoptimized
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6"
                        onClick={() => removeNewImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      <div className="absolute bottom-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                        New
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="images"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">PNG, JPG, WebP (MAX. 5MB each)</p>
                  </div>
                  <input id="images" type="file" className="hidden" accept="image/*" multiple onChange={handleImageChange} />
                </label>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Active (visible to customers)</Label>
            </div>

            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Saving..." : editingEvent ? "Update Event" : "Add Event"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4">
        {events.map((event) => (
          <Card key={event.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{event.title}</h3>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        event.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {event.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  {event.description ? <p className="text-sm text-muted-foreground mb-2">{event.description}</p> : null}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    <span>${event.price_per_entry.toFixed(2)} per entry</span>
                    {event.starts_at ? <span>Starts: {new Date(event.starts_at).toLocaleString()}</span> : <span>Starts: TBD</span>}
                    {event.location ? <span>Location: {event.location}</span> : <span>Location: TBD</span>}
                    {typeof event.capacity === "number" ? <span>Capacity: {event.capacity}</span> : <span>Capacity: TBD</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => openEditDialog(event)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => handleDelete(event.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}


