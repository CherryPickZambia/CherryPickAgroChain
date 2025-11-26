"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Calendar, MapPin, User, FileText, Flag, Briefcase } from "lucide-react";
import toast from "react-hot-toast";

interface NewJobModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onCreateJobAction: (job: JobData) => void;
  farmers: { id: string; name: string; location: string }[];
}

export interface JobData {
  id: string;
  title: string;
  description: string;
  jobType: "planting" | "harrowing" | "weeding" | "fertilizing" | "harvesting" | "inspection" | "other";
  assignedTo?: string;
  assignedFarmerName?: string;
  farmLocation: string;
  dueDate: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "completed" | "overdue";
  createdAt: string;
}

const JOB_TYPES = [
  { value: "planting", label: "Planting", color: "bg-green-100 text-green-700" },
  { value: "harrowing", label: "Harrowing", color: "bg-amber-100 text-amber-700" },
  { value: "weeding", label: "Weeding", color: "bg-lime-100 text-lime-700" },
  { value: "fertilizing", label: "Fertilizing", color: "bg-blue-100 text-blue-700" },
  { value: "harvesting", label: "Harvesting", color: "bg-orange-100 text-orange-700" },
  { value: "inspection", label: "Inspection", color: "bg-purple-100 text-purple-700" },
  { value: "other", label: "Other", color: "bg-gray-100 text-gray-700" },
];

const PRIORITIES = [
  { value: "low", label: "Low", color: "bg-gray-100 text-gray-600" },
  { value: "medium", label: "Medium", color: "bg-blue-100 text-blue-600" },
  { value: "high", label: "High", color: "bg-orange-100 text-orange-600" },
  { value: "urgent", label: "Urgent", color: "bg-red-100 text-red-600" },
];

export default function NewJobModal({ isOpen, onCloseAction, onCreateJobAction, farmers }: NewJobModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    jobType: "planting" as const,
    assignedTo: "",
    farmLocation: "",
    dueDate: "",
    priority: "medium" as const,
  });

  const handleSubmit = () => {
    if (!formData.title || !formData.dueDate || !formData.farmLocation) {
      toast.error("Please fill in all required fields");
      return;
    }

    const selectedFarmer = farmers.find(f => f.id === formData.assignedTo);

    const newJob: JobData = {
      id: `job-${Date.now()}`,
      title: formData.title,
      description: formData.description,
      jobType: formData.jobType,
      assignedTo: formData.assignedTo || undefined,
      assignedFarmerName: selectedFarmer?.name,
      farmLocation: formData.farmLocation,
      dueDate: formData.dueDate,
      priority: formData.priority,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    onCreateJobAction(newJob);
    toast.success("Job created successfully!");
    
    // Reset form
    setFormData({
      title: "",
      description: "",
      jobType: "planting",
      assignedTo: "",
      farmLocation: "",
      dueDate: "",
      priority: "medium",
    });
    
    onCloseAction();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCloseAction}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-xl">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Create New Job</h3>
                      <p className="text-emerald-100 text-sm">Assign tasks to farmers</p>
                    </div>
                  </div>
                  <button 
                    onClick={onCloseAction}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Form */}
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                {/* Job Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job Title *
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Harrowing Season Preparation"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Job Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Type *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {JOB_TYPES.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, jobType: type.value as any })}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          formData.jobType === type.value
                            ? `${type.color} ring-2 ring-offset-1 ring-emerald-500`
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Farm Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Farm Location *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      value={formData.farmLocation}
                      onChange={(e) => setFormData({ ...formData, farmLocation: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
                    >
                      <option value="">Select location...</option>
                      <option value="ABY Farm - Bay Land">ABY Farm - Bay Land</option>
                      <option value="YNS Farm - ARD Land">YNS Farm - ARD Land</option>
                      <option value="Lusaka Central Farm">Lusaka Central Farm</option>
                      <option value="Kabwe North Fields">Kabwe North Fields</option>
                      <option value="Kitwe Agricultural Zone">Kitwe Agricultural Zone</option>
                    </select>
                  </div>
                </div>

                {/* Assigned To */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assign to Farmer
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      value={formData.assignedTo}
                      onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
                    >
                      <option value="">Select farmer (optional)...</option>
                      {farmers.map((farmer) => (
                        <option key={farmer.id} value={farmer.id}>
                          {farmer.name} - {farmer.location}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <div className="flex gap-2">
                    {PRIORITIES.map((priority) => (
                      <button
                        key={priority.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, priority: priority.value as any })}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          formData.priority === priority.value
                            ? `${priority.color} ring-2 ring-offset-1 ring-emerald-500`
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {priority.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Add any additional details about this job..."
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 pb-6 flex gap-3">
                <button
                  onClick={onCloseAction}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create Job
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
