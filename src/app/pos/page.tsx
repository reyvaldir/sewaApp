"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { getProducts, getCategories } from "@/app/actions/pos";

// Temporary Types mapping what we get from Prisma
type ProductWithCount = Awaited<ReturnType<typeof getProducts>>[0];
type Category = Awaited<ReturnType<typeof getCategories>>[0];

export default function POSPage() {
  const [products, setProducts] = useState<ProductWithCount[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("All Products");
  const [isLoading, setIsLoading] = useState(true);

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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-gray-500" />
              Current Order
            </h2>
            <button className="flex items-center gap-2 text-sm text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors font-medium">
              <Calendar className="w-4 h-4" />
              <span>Oct 24 - Oct 26</span>
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {/* Dummy Cart Item */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-gray-800">Premium Costume 1</h4>
                <div className="text-sm text-gray-500 mt-1">
                  2 days (UNIT-X99)
                </div>
              </div>
              <div className="text-right ml-4">
                <div className="font-semibold text-gray-800">Rp 300.000</div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary & Checkout */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          {/* KTP Section */}
          <div className="mb-6 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-indigo-600" />
              Guarantee (KTP)
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="flex flex-col items-center justify-center gap-2 py-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-colors group">
                <Camera className="w-6 h-6 text-gray-400 group-hover:text-indigo-500" />
                <span className="text-xs font-medium text-gray-500 group-hover:text-indigo-600">
                  Take Photo
                </span>
              </button>
              <button className="flex flex-col items-center justify-center gap-2 py-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-colors group">
                <Upload className="w-6 h-6 text-gray-400 group-hover:text-indigo-500" />
                <span className="text-xs font-medium text-gray-500 group-hover:text-indigo-600">
                  Upload File
                </span>
              </button>
            </div>
            <p className="text-[11px] text-gray-400 mt-3 text-center">
              Required to waive the Rp 1.000.000 deposit.
            </p>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>Rp 300.000</span>
            </div>
            <div className="flex justify-between text-emerald-600 font-medium text-sm">
              <span>Deposit Requirement</span>
              <span>Waived (KTP Provided)</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-800 pt-3 border-t border-gray-200">
              <span>Total Payout</span>
              <span className="text-indigo-600">Rp 300.000</span>
            </div>
          </div>
          <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 transition-all flex justify-center items-center gap-2 text-lg">
            <CreditCard className="w-6 h-6" />
            Process Rental
          </button>
        </div>
      </div>
    </div>
  );
}
