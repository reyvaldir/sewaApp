"use client";

import React, { useState, useEffect, useRef } from "react";
import { addDays, format, differenceInDays } from "date-fns";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";
import {
  Search,
  ShoppingCart,
  User,
  CreditCard,
  ChevronDown,
  Package,
  Calendar,
  Camera,
  Upload,
  X,
} from "lucide-react";
import { getProducts, getCategories } from "@/app/actions/pos";

// Temporary Types mapping what we get from Prisma
type ProductWithCount = Awaited<ReturnType<typeof getProducts>>[0];
type Category = Awaited<ReturnType<typeof getCategories>>[0];

type CartItem = {
  id: string; // generate temporary id for cart line item
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // KTP Guarantee State
  const [ktpPhoto, setKtpPhoto] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isKtpExpanded, setIsKtpExpanded] = useState(false);
  const [isGuaranteeModalOpen, setIsGuaranteeModalOpen] = useState(false);

  // Close calendar when clicking outside
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

  // Calculate rental duration in days (minimum 1 day)
  const rentalDays =
    dateRange?.from && dateRange?.to
      ? Math.max(1, differenceInDays(dateRange.to, dateRange.from))
      : 1;

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);

  // Derived state
  const depositWaived = ktpPhoto !== null;

  const subtotal = cart.reduce(
    (acc, item) => acc + item.product.pricePerDay * item.quantity * rentalDays, // Use global rentalDays here
    0,
  );
  // Total Payout omits deposit because we assume KTP is provided, if not, add deposit.
  const baseDeposit = 1000000;
  const totalPayout = depositWaived ? subtotal : subtotal + baseDeposit;

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
      : products.filter((p) => p.category.name === activeCategory);

  const handleAddToCart = (product: ProductWithCount) => {
    setCart((prevCart) => {
      // Check if product is already in cart
      const existingItem = prevCart.find(
        (item) => item.product.id === product.id,
      );

      if (existingItem) {
        // Increase quantity
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      } else {
        // Add new item to cart
        return [
          ...prevCart,
          {
            id: Math.random().toString(36).substring(7),
            product,
            quantity: 1,
            days: 1, // days property in CartItem is deprecated in favor of global rentalDays, but kept for type safety temp
          },
        ];
      }
    });
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === cartItemId) {
          const newQuantity = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQuantity };
        }
        return item;
      }),
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setKtpPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
      setIsKtpExpanded(true); // Auto expand when new photo is uploaded
    }
  };

  const removeKtpPhoto = () => {
    setKtpPhoto(null);
    setIsKtpExpanded(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // WebRTC Camera Logic
  const openCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert(
        "Unable to access camera. Please ensure you have granted permission.",
      );
      setIsCameraOpen(false);
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
        setIsKtpExpanded(true); // Auto expand when new photo is captured
        closeCamera();
      }
    }
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar / Left Section - Product Selection */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
              Costume POS
            </h1>
          </div>
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by barcode, unit, or product name..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 border-transparent rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
        </header>

        {/* Categories Bar */}
        <div className="bg-white px-6 py-3 border-b border-gray-200 flex gap-4 overflow-x-auto whitespace-nowrap">
          <button
            onClick={() => setActiveCategory("All Products")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeCategory === "All Products"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All Products
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.name)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat.name
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <main className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              Loading inventory...
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleAddToCart(item)}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group cursor-pointer"
                >
                  <div className="h-40 bg-gray-200 w-full relative">
                    {/* Placeholder Image */}
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-bold text-indigo-700">
                      {item._count.inventoryUnits} Available
                    </div>
                  </div>
                  <div className="p-4">
                    <h3
                      className="font-semibold text-gray-800 line-clamp-1"
                      title={item.name}
                    >
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Rp {Number(item.pricePerDay).toLocaleString("id-ID")} /
                      day
                    </p>
                  </div>
                </div>
              ))}
              {filteredProducts.length === 0 && (
                <div className="col-span-full text-center text-gray-500 py-10">
                  No products found in this category.
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Right Section - Cart & Checkout */}
      <div className="w-full md:w-96 bg-white border-l border-gray-200 h-screen flex flex-col shadow-xl z-10">
        {/* Customer Info */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <User className="w-5 h-5 text-gray-500" />
              Customer
            </h2>
            <button className="text-indigo-600 text-sm font-medium hover:text-indigo-700">
              Select
            </button>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors">
            <span className="text-gray-500 font-medium">Walk-in Customer</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        </div>
        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Current Order Header */}
          <div className="flex items-center justify-between mb-4 relative">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-gray-500" />
              Current Order
            </h2>
            <button
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              className="flex items-center gap-2 text-sm text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors font-medium relative"
            >
              <Calendar className="w-4 h-4" />
              <span>
                {dateRange?.from ? format(dateRange.from, "MMM dd") : "Start"} -{" "}
                {dateRange?.to ? format(dateRange.to, "MMM dd") : "End"} (
                {rentalDays} days)
              </span>
            </button>

            {/* Date Picker Popover */}
            {isCalendarOpen && (
              <div
                ref={calendarRef}
                className="absolute top-12 right-0 bg-white rounded-xl shadow-xl border border-gray-200 z-50 p-2"
              >
                <div className="flex justify-between items-center px-4 py-2 border-b border-gray-100 mb-2">
                  <h3 className="font-semibold text-gray-800 text-sm">
                    Select Rental Period
                  </h3>
                  <button
                    onClick={() => setIsCalendarOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <DayPicker
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  min={1}
                  disabled={[{ before: new Date() }]}
                  className="p-3"
                  classNames={{
                    day_selected:
                      "bg-indigo-600 text-white hover:bg-indigo-600 hover:text-white",
                    day_range_middle: "bg-indigo-50 text-indigo-900",
                    day_today: "font-bold text-indigo-600",
                  }}
                />
              </div>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto mb-6 pr-2 space-y-4 min-h-[150px]">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
                <ShoppingCart className="w-12 h-12 opacity-20" />
                <p className="text-sm">No items in order</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-3 bg-white rounded-xl border border-gray-100 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)]"
                >
                  <div className="w-16 h-16 bg-gray-100 rounded-lg shrink-0 flex items-center justify-center text-xs text-gray-400">
                    Img
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-semibold text-sm text-gray-800 line-clamp-2 leading-tight">
                        {item.product.name}
                      </h4>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
                      >
                        &times;
                      </button>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {rentalDays} days
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-bold text-gray-800 text-sm">
                        Rp{" "}
                        {(
                          item.product.pricePerDay *
                          item.quantity *
                          rentalDays
                        ).toLocaleString("id-ID")}
                      </span>
                      <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-200 rounded-l-lg transition-colors"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-xs font-semibold text-gray-700">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-200 rounded-r-lg transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>{" "}
        {/* Close the Cart Items container (line 263: flex-1 overflow-y-auto p-6) */}
        {/* Bottom Section: Guarantee + Summary + Checkout */}
        <div className="mt-auto pt-4 border-t border-gray-200 flex-shrink-0 p-6">
          {/* Guarantee (KTP) Compact View */}
          <div className="mb-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent group-hover:from-indigo-100/50 transition-colors" />
            <div className="flex items-center justify-between relative">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-bold text-gray-800">
                    Guarantee (KTP)
                  </h3>
                  {ktpPhoto ? (
                    <p className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                      Verified ✓
                    </p>
                  ) : (
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Required for waive deposit
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={() => setIsGuaranteeModalOpen(true)}
                className={`text-xs font-semibold px-4 py-2 rounded-lg transition-colors border ${
                  ktpPhoto
                    ? "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                    : "bg-indigo-50 border-indigo-100 text-indigo-700 hover:bg-indigo-100"
                }`}
              >
                {ktpPhoto ? "Manage" : "Add KTP"}
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-3 mb-4">
            <div className="flex justify-between text-gray-500 text-sm">
              <span>Subtotal</span>
              <span className="font-medium text-gray-800">
                Rp {subtotal.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex justify-between text-xl font-black text-gray-800 pt-3 border-t border-gray-200">
              <span>Total Payout</span>
              <span className="text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                Rp {totalPayout.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
          <button
            disabled={cart.length === 0}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] transition-all flex justify-center items-center gap-2 text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            <CreditCard className="w-5 h-5" />
            Process Rental
          </button>
        </div>
      </div>

      {/* Guarantee (KTP) Modal Box */}
      {isGuaranteeModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600" />
                Provide Guarantee (KTP)
              </h3>
              <button
                onClick={() => setIsGuaranteeModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full p-1.5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {ktpPhoto ? (
                <div className="space-y-4">
                  <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50 aspect-video flex items-center justify-center group">
                    <img
                      src={ktpPhoto}
                      alt="KTP Preview"
                      className="max-h-full object-contain"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={removeKtpPhoto}
                      className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-2.5 rounded-xl border border-red-200 transition-colors flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Remove KTP
                    </button>
                    <button
                      onClick={() => setIsGuaranteeModalOpen(false)}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl shadow-md transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 text-center mb-6">
                    A valid KTP is required to waive the{" "}
                    <strong className="text-gray-800">Rp 1.000.000</strong>{" "}
                    security deposit during the rental period.
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => {
                        setIsGuaranteeModalOpen(false);
                        setIsCameraOpen(true);
                      }}
                      className="flex flex-col items-center justify-center gap-3 py-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-indigo-400 hover:bg-indigo-50/50 transition-all text-indigo-600 group"
                    >
                      <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Camera className="w-6 h-6" />
                      </div>
                      <span className="font-semibold text-sm">Take Photo</span>
                    </button>

                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center gap-3 py-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-indigo-400 hover:bg-indigo-50/50 transition-all cursor-pointer text-indigo-600 group"
                    >
                      <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Upload className="w-6 h-6" />
                      </div>
                      <span className="font-semibold text-sm">Upload File</span>
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => setIsGuaranteeModalOpen(false)}
                    className="w-full mt-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Camera Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">Take Photo of KTP</h3>
              <button
                onClick={closeCamera}
                className="text-gray-500 hover:text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-full p-2 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex flex-col items-center">
              <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden mb-6 shadow-inner">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 border-2 border-dashed border-white/40 m-8 rounded-lg pointer-events-none" />
              </div>
              <button
                onClick={takePhoto}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-indigo-200 transition-all flex items-center gap-2"
              >
                <Camera className="w-5 h-5" />
                Capture Photo
              </button>
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>
      )}
    </div>
  );
}
