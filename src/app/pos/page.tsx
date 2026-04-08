"use client";

import React, { useState, useEffect, useRef } from "react";
import { addDays, format, differenceInDays } from "date-fns";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { useSession, signOut } from "next-auth/react";
import { getProducts, getCategories } from "@/app/actions/pos";

type ProductWithCount = Awaited<ReturnType<typeof getProducts>>[0];
type Category = Awaited<ReturnType<typeof getCategories>>[0];

type CartItem = {
  id: string;
  product: ProductWithCount;
  quantity: number;
  days: number;
};

export default function POSPage() {
  const [products, setProducts] = useState<ProductWithCount[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("All Products");
  const [isLoading, setIsLoading] = useState(true);

  // Date Range State
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 2),
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Camera State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ktpPhoto, setKtpPhoto] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment",
  );

  // Auth session
  const { data: session } = useSession();

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);

  // Close calendar outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        setIsCalendarOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const rentalDays =
    dateRange?.from && dateRange?.to
      ? Math.max(1, differenceInDays(dateRange.to, dateRange.from))
      : 1;

  const depositWaived = ktpPhoto !== null;
  const subtotal = cart.reduce(
    (acc, item) => acc + item.product.pricePerDay * item.quantity * rentalDays,
    0,
  );
  const baseDeposit = cart.length > 0 ? 1000000 : 0; // Rp 1.000.000 base deposit if cart has items
  const activeDeposit = depositWaived ? 0 : baseDeposit;
  const totalPayout = subtotal + activeDeposit;

  React.useEffect(() => {
    async function loadData() {
      try {
        const [fetchedProducts, fetchedCategories] = await Promise.all([
          getProducts(),
          getCategories(),
        ]);
        setProducts(fetchedProducts);
        setCategories(fetchedCategories);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredProducts =
    activeCategory === "All Products"
      ? products
      : products.filter((p) => p.category?.name === activeCategory);

  const handleAddToCart = (product: ProductWithCount) => {
    const available = product._count.inventoryUnits;
    if (available <= 0) return; // Disallow out of stock

    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (item) => item.product.id === product.id,
      );
      if (existingItem) {
        if (existingItem.quantity >= available) return prevCart; // Max limit
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      } else {
        return [
          ...prevCart,
          {
            id: Math.random().toString(36).substring(7),
            product,
            quantity: 1,
            days: 1,
          },
        ];
      }
    });
  };

  const removeFromCart = (cartItemId: string) =>
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));

  const updateQuantity = (
    cartItemId: string,
    delta: number,
    available: number,
  ) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === cartItemId) {
          const newQuantity = Math.max(
            1,
            Math.min(item.quantity + delta, available),
          );
          return { ...item, quantity: newQuantity };
        }
        return item;
      }),
    );
  };

  // Camera Logic
  const openCamera = async (mode: "user" | "environment" = facingMode) => {
    setIsCameraOpen(true);
    setFacingMode(mode);

    if (videoRef.current && videoRef.current.srcObject) {
      const currentStream = videoRef.current.srcObject as MediaStream;
      currentStream.getTracks().forEach((track) => track.stop());
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode },
      });
      setCameraStream(stream);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("Camera failed:", err);
      if (mode === "environment") {
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user" },
          });
          setFacingMode("user");
          setCameraStream(fallbackStream);
          if (videoRef.current) videoRef.current.srcObject = fallbackStream;
        } catch (fallbackErr) {
          alert("Unable to access camera.");
          setIsCameraOpen(false);
        }
      } else {
        alert("Unable to access camera.");
        setIsCameraOpen(false);
      }
    }
  };

  const closeCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCameraOpen(false);
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const photoDataUrl = canvas.toDataURL("image/jpeg");
        setKtpPhoto(photoDataUrl);
        closeCamera();
      }
    }
  };

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  useEffect(() => {
    if (isCameraOpen && cameraStream && videoRef.current) {
      if (videoRef.current.srcObject !== cameraStream) {
        videoRef.current.srcObject = cameraStream;
      }
    }
  }, [isCameraOpen, cameraStream]);

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-text-primary-light dark:text-text-primary-dark min-h-screen flex flex-col overflow-hidden relative">
      {/* Calendar Modal */}
      {isCalendarOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsCalendarOpen(false)}
          ></div>
          <div
            ref={calendarRef}
            className="relative bg-white dark:bg-surface-dark w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700"
          >
            <div className="p-6 pb-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">
                  calendar_month
                </span>
                Select Rental Period
              </h3>
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
                Please select the start and end date for this rental.
              </p>
            </div>
            <div className="flex justify-center p-4">
              <DayPicker
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                min={1}
                disabled={[{ before: new Date() }]}
                className="p-3"
                classNames={{
                  day_selected:
                    "bg-primary text-white hover:bg-primary-hover hover:text-white rounded",
                  day_range_middle: "bg-primary/20 text-primary",
                  day_today: "font-bold text-primary",
                }}
              />
            </div>
            <div className="p-6 bg-gray-50 dark:bg-gray-800/50 flex gap-3">
              <button
                onClick={() => setIsCalendarOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 font-semibold text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setIsCalendarOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all"
              >
                Confirm Dates
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Fullscreen Modal (retained for capture since inline is tricky for mobile) */}
      {isCameraOpen && (
        <div className="fixed inset-0 bg-black/80 z-[110] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
              <h3 className="font-bold text-gray-800 dark:text-gray-100">
                Take Photo of KTP
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    openCamera(
                      facingMode === "environment" ? "user" : "environment",
                    )
                  }
                  className="flex items-center gap-1.5 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    flip_camera_ios
                  </span>{" "}
                  Flip
                </button>
                <button
                  onClick={closeCamera}
                  className="text-gray-500 hover:text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-full p-2 transition-colors flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-sm">
                    close
                  </span>
                </button>
              </div>
            </div>
            <div className="p-6 flex flex-col items-center">
              <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden mb-6 shadow-inner">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 border-2 border-dashed border-white/40 m-8 rounded-lg pointer-events-none" />
              </div>
              <button
                onClick={takePhoto}
                className="bg-primary hover:bg-primary-hover text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">
                  photo_camera
                </span>{" "}
                Capture Photo
              </button>
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-gray-200 dark:border-gray-800 bg-surface-light dark:bg-surface-dark px-6 py-3 shadow-sm z-20 shrink-0">
        <div className="flex items-center gap-4">
          <div className="size-8 rounded bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-2xl">
              checkroom
            </span>
          </div>
          <h2 className="text-lg font-bold leading-tight">Costume POS</h2>
        </div>
        <div className="flex flex-1 justify-end gap-6 items-center">
          <nav className="hidden md:flex items-center gap-6">
            <a className="text-sm font-medium hover:text-primary transition-colors cursor-pointer">
              Dashboard
            </a>
            <a className="text-sm font-medium text-primary cursor-pointer">
              Rental POS
            </a>
            <a className="text-sm font-medium hover:text-primary transition-colors cursor-pointer">
              Orders
            </a>
            <a className="text-sm font-medium hover:text-primary transition-colors cursor-pointer">
              Inventory
            </a>
          </nav>
          <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden md:block"></div>
          <div className="flex items-center gap-4 text-sm font-medium text-[--surface-dark]">
            <span>Staff: {session?.user?.name || "Loading..."}</span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              title="Sign Out"
              className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        {/* Left Content */}
        <div className="flex flex-col w-full lg:w-[70%] h-full overflow-hidden bg-background-light dark:bg-background-dark border-r border-gray-200 dark:border-gray-800">
          <div className="p-6 pb-2 space-y-4 bg-background-light dark:bg-background-dark z-10">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-secondary-light dark:text-text-secondary-dark">
                <span className="material-symbols-outlined">search</span>
              </div>
              <input
                className="w-full pl-11 pr-4 py-3 rounded-xl border-none bg-white dark:bg-surface-dark shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-primary focus:outline-none transition-shadow text-base placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Scan barcode or search item name / SKU..."
                type="text"
              />
              <button className="absolute inset-y-2 right-2 px-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark transition-colors">
                ⌘K
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setActiveCategory("All Products")}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-transform active:scale-95 ${activeCategory === "All Products" ? "bg-primary text-white shadow-sm shadow-primary/30" : "bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 hover:border-primary/50 text-text-secondary-light dark:text-text-secondary-dark hover:text-primary"}`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  apps
                </span>
                All Items
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.name)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-transform active:scale-95 ${activeCategory === cat.name ? "bg-primary text-white shadow-sm shadow-primary/30" : "bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 hover:border-primary/50 text-text-secondary-light dark:text-text-secondary-dark hover:text-primary"}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 pt-2">
            {isLoading ? (
              <div className="flex items-center justify-center p-20 text-gray-400">
                Loading products...
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
                {filteredProducts.map((item) => {
                  const available = item._count.inventoryUnits;
                  const outOfStock = available <= 0;
                  const qtyInCartCheck =
                    cart.find((c) => c.product.id === item.id)?.quantity || 0;
                  const actuallyOutOfStock =
                    outOfStock || qtyInCartCheck >= available;

                  return (
                    <div
                      key={item.id}
                      onClick={() =>
                        !actuallyOutOfStock && handleAddToCart(item)
                      }
                      className={`group bg-surface-light dark:bg-surface-dark rounded-xl p-3 shadow-sm transition-all border border-transparent flex flex-col h-full relative ${actuallyOutOfStock ? "opacity-70 cursor-not-allowed" : "hover:shadow-md hover:border-primary/30 cursor-pointer"}`}
                    >
                      <div
                        className={`absolute top-4 right-4 z-10 bg-white/90 dark:bg-black/50 backdrop-blur px-2 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1 ${actuallyOutOfStock ? "text-red-600 border-red-200" : "text-green-600 border-green-200"}`}
                      >
                        <div
                          className={`size-1.5 rounded-full ${actuallyOutOfStock ? "bg-red-500" : "bg-green-500"}`}
                        ></div>{" "}
                        {actuallyOutOfStock
                          ? "Out"
                          : `${available - qtyInCartCheck} Avail`}
                      </div>
                      {actuallyOutOfStock && (
                        <div className="absolute inset-0 bg-white/50 dark:bg-black/50 z-[5] rounded-xl flex items-center justify-center pointer-events-none">
                          <span className="bg-black/80 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                            Out of Stock
                          </span>
                        </div>
                      )}
                      <div
                        className={`aspect-[4/5] w-full rounded-lg bg-gray-100 dark:bg-gray-800 mb-3 overflow-hidden flex items-center justify-center text-gray-400 ${actuallyOutOfStock ? "grayscale" : ""}`}
                      >
                        No Image
                      </div>
                      <div className="mt-auto">
                        <h3 className="font-semibold text-text-primary-light dark:text-text-primary-dark line-clamp-1">
                          {item.name}
                        </h3>
                        <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mb-2">
                          Category: {item.category?.name || "Uncategorized"}
                        </p>
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-bold ${actuallyOutOfStock ? "text-gray-400" : "text-primary"}`}
                          >
                            Rp{" "}
                            {Number(item.pricePerDay).toLocaleString("id-ID")}
                          </span>
                          <button
                            className={`size-8 rounded-full flex items-center justify-center transition-colors ${actuallyOutOfStock ? "bg-gray-100 text-gray-300" : "bg-gray-100 text-gray-600 group-hover:bg-primary group-hover:text-white"}`}
                          >
                            <span className="material-symbols-outlined text-sm">
                              {actuallyOutOfStock ? "block" : "add"}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <div className="col-span-full text-center text-text-secondary-light py-10">
                    No products match this category.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-full lg:w-[30%] bg-white dark:bg-surface-dark flex flex-col h-full shadow-2xl z-20">
          <div className="p-6 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">
                  shopping_cart
                </span>{" "}
                Order Details
              </h2>
              <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded">
                DRAFT
              </span>
            </div>

            <details
              className="group bg-background-light dark:bg-background-dark rounded-lg p-3 open"
              open
            >
              <summary className="flex justify-between items-center font-medium cursor-pointer list-none text-sm text-text-primary-light dark:text-text-primary-dark">
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">
                    person
                  </span>{" "}
                  Customer Info
                </span>
                <span className="transition group-open:rotate-180">
                  <span className="material-symbols-outlined">expand_more</span>
                </span>
              </summary>
              <div className="mt-3 group-open:animate-fadeIn space-y-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-text-secondary-light dark:text-text-secondary-dark tracking-wider mb-1 block">
                    Full Name
                  </label>
                  <input
                    className="w-full text-sm px-2 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    placeholder="Walk-in Customer"
                    type="text"
                  />
                </div>

                {/* KTP Camera Card built straight into Sidebar Details */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-text-secondary-light dark:text-text-secondary-dark tracking-wider mb-1 block">
                    Guarantee ID (KTP Deposit Waive)
                  </label>
                  {ktpPhoto ? (
                    <div className="relative w-full aspect-video bg-gray-100 dark:bg-black rounded-lg overflow-hidden group/cam flex items-center justify-center border border-gray-200">
                      <img
                        src={ktpPhoto}
                        alt="KTP Photo"
                        className="max-h-full object-contain"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/cam:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          onClick={() => setKtpPhoto(null)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            delete
                          </span>{" "}
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative w-full aspect-video bg-gray-100 dark:bg-black rounded-lg overflow-hidden group/cam border border-dashed border-gray-300 dark:border-gray-700">
                      <div className="absolute inset-0 flex flex-col gap-2 items-center justify-center text-gray-400">
                        <span className="material-symbols-outlined text-4xl">
                          id_card
                        </span>
                        <span className="text-xs text-center px-4">
                          Rp 1M Deposit required without KTP
                        </span>
                      </div>
                      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2">
                        <button
                          onClick={() => openCamera()}
                          className="bg-primary hover:bg-primary-hover text-white shadow-md text-xs px-3 py-1 rounded-full flex items-center gap-1 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">
                            photo_camera
                          </span>{" "}
                          Capture
                        </button>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-white dark:bg-surface-dark text-text-primary-light border shadow-sm dark:text-text-primary-dark text-xs px-3 py-1 rounded-full flex items-center gap-1 hover:bg-gray-50 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">
                            upload
                          </span>{" "}
                          File
                        </button>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const r = new FileReader();
                            r.onloadend = () => setKtpPhoto(r.result as string);
                            r.readAsDataURL(file);
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </details>
          </div>

          {/* Cart Header + Date Range Trigger */}
          <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
            <button
              onClick={() => setIsCalendarOpen(true)}
              className="flex items-center justify-between w-full px-3 py-2 bg-white dark:bg-surface-dark border border-gray-200 hover:border-primary transition-colors rounded-lg group text-sm text-text-primary-light dark:text-text-primary-dark shadow-sm"
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px] group-hover:scale-110 transition-transform">
                  event
                </span>
                <span className="font-medium">
                  {dateRange?.from ? format(dateRange.from, "MMM dd") : "Start"}{" "}
                  — {dateRange?.to ? format(dateRange.to, "MMM dd") : "End"}
                </span>
              </span>
              <span className="font-bold text-primary bg-primary/10 px-2 rounded">
                {rentalDays} Day
              </span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-40">
                <span className="material-symbols-outlined text-6xl mb-2">
                  production_quantity_limits
                </span>
                <p className="text-sm font-medium">Cart is empty</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 bg-background-light dark:bg-background-dark p-2 rounded-lg group border border-transparent hover:border-gray-200"
                >
                  <div className="size-14 rounded-md bg-white border border-gray-200 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-gray-300">
                      image
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-sm text-text-primary-light dark:text-text-primary-dark truncate pr-2">
                        {item.product.name}
                      </h4>
                      <span className="font-semibold text-sm text-primary whitespace-nowrap">
                        Rp{" "}
                        {(item.product.pricePerDay * rentalDays).toLocaleString(
                          "id-ID",
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md bg-white overflow-hidden">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              -1,
                              item.product._count.inventoryUnits,
                            )
                          }
                          className="px-2 py-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 font-bold"
                        >
                          -
                        </button>
                        <span className="px-2 text-xs font-medium w-6 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              1,
                              item.product._count.inventoryUnits,
                            )
                          }
                          className="px-2 py-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 font-bold"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-gray-400 hover:text-red-500 rounded p-1 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          delete
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="bg-white dark:bg-surface-dark p-6 border-t border-gray-200 dark:border-gray-800 z-30">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm text-text-secondary-light dark:text-text-secondary-dark">
                <span>Subtotal ({cart.length} item)</span>
                <span>Rp {subtotal.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-sm text-text-secondary-light dark:text-text-secondary-dark">
                <span>
                  Deposit (Jaminan){" "}
                  {depositWaived ? (
                    <span className="text-green-500 font-medium ml-1">
                      WAIVED
                    </span>
                  ) : (
                    ""
                  )}
                </span>
                <span
                  className={depositWaived ? "line-through text-gray-300" : ""}
                >
                  Rp {baseDeposit.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="h-px bg-gray-200 dark:bg-gray-700 my-2"></div>
              <div className="flex justify-between items-end">
                <span className="text-base font-bold text-text-primary-light dark:text-text-primary-dark">
                  Total Payout
                </span>
                <span className="text-2xl font-black text-primary">
                  Rp {totalPayout.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
            <button
              disabled={cart.length === 0}
              className="w-full bg-primary hover:bg-primary-hover disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold text-base shadow-lg shadow-primary/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
            >
              <span>Checkout Order</span>
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
