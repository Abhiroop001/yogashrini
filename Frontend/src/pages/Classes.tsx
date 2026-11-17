// src/pages/Classes.tsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./Classes.css";
import {
  MdSelfImprovement,
  MdAccessTime,
  MdLocationOn,
  MdPerson,
  MdFilterList,
  MdCheckCircle,
  MdCalendarToday,
  MdClose
} from "react-icons/md";
import { GiMeditation, GiLotus } from "react-icons/gi";

interface YogaClass {
  id: string;
  day: string;
  title: string;
  style: string;
  time: string;
  instructor: string;
  location: string;
  level: "All Levels" | "Beginner" | "Intermediate" | "Advanced";
  capacity: string;
}

const SCHEDULE: YogaClass[] = [
  {
    id: "cls-1",
    day: "Monday",
    title: "Morning Sun Hatha Yoga",
    style: "Hatha",
    time: "07:00 AM - 08:15 AM",
    instructor: "Acharya Rajesh",
    location: "Studio Hall A & Live Online",
    level: "All Levels",
    capacity: "16 / 20 booked",
  },
  {
    id: "cls-2",
    day: "Monday",
    title: "Vinyasa Dynamic Flow",
    style: "Vinyasa",
    time: "05:30 PM - 06:45 PM",
    instructor: "Priya Sharma",
    location: "Studio Hall B",
    level: "Intermediate",
    capacity: "18 / 20 booked",
  },
  {
    id: "cls-3",
    day: "Tuesday",
    title: "Pranayama & Mindful Meditation",
    style: "Pranayama",
    time: "06:30 AM - 07:30 AM",
    instructor: "Swami Anand",
    location: "Meditation Sanctum",
    level: "All Levels",
    capacity: "12 / 25 booked",
  },
  {
    id: "cls-4",
    day: "Tuesday",
    title: "Ashtanga Primary Series",
    style: "Ashtanga",
    time: "06:00 PM - 07:30 PM",
    instructor: "Acharya Rajesh",
    location: "Studio Hall A",
    level: "Advanced",
    capacity: "14 / 15 booked",
  },
  {
    id: "cls-5",
    day: "Wednesday",
    title: "Gentle Alignment & Core Stability",
    style: "Hatha",
    time: "08:00 AM - 09:15 AM",
    instructor: "Ananya Mukherjee",
    location: "Studio Hall B",
    level: "Beginner",
    capacity: "10 / 18 booked",
  },
  {
    id: "cls-6",
    day: "Wednesday",
    title: "Deep Yin & Restorative Release",
    style: "Yin",
    time: "06:30 PM - 07:45 PM",
    instructor: "Priya Sharma",
    location: "Studio Hall A & Live Online",
    level: "All Levels",
    capacity: "20 / 22 booked",
  },
  {
    id: "cls-7",
    day: "Thursday",
    title: "Power Yoga & Agility",
    style: "Vinyasa",
    time: "07:00 AM - 08:15 AM",
    instructor: "Priya Sharma",
    location: "Studio Hall B",
    level: "Intermediate",
    capacity: "15 / 20 booked",
  },
  {
    id: "cls-8",
    day: "Friday",
    title: "Chakra Balance & Sound Healing",
    style: "Meditation",
    time: "06:00 PM - 07:30 PM",
    instructor: "Swami Anand",
    location: "Sound Sanctum",
    level: "All Levels",
    capacity: "24 / 25 booked",
  },
  {
    id: "cls-9",
    day: "Saturday",
    title: "Weekend Masterclass: Asana Biomechanics",
    style: "Workshop",
    time: "09:00 AM - 11:30 AM",
    instructor: "Acharya Rajesh",
    location: "Main Auditorium",
    level: "Intermediate",
    capacity: "28 / 30 booked",
  },
  {
    id: "cls-10",
    day: "Sunday",
    title: "Community Satsang & Gentle Asana",
    style: "Restorative",
    time: "08:30 AM - 10:00 AM",
    instructor: "All Faculty",
    location: "Open Garden Pavilion",
    level: "All Levels",
    capacity: "Open to All",
  },
];

const DAYS = ["All", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const Classes: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState<string>("All");
  const [selectedClass, setSelectedClass] = useState<YogaClass | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<boolean>(false);

  const filtered = SCHEDULE.filter((c) => selectedDay === "All" || c.day === selectedDay);

  const handleBook = (cls: YogaClass) => {
    setSelectedClass(cls);
    setBookingSuccess(false);
  };

  const confirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingSuccess(true);
    setTimeout(() => {
      setSelectedClass(null);
      setBookingSuccess(false);
    }, 2000);
  };

  return (
    <div className="classes-page-container">
      {/* Hero Header */}
      <motion.header
        className="ud-hero-section mb-4"
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="yoga-container">
          <div className="d-flex align-items-center gap-3">
            <div className="ud-ai-badge-icon">
              <GiMeditation size={28} />
            </div>
            <div>
              <h1 className="m-0 fs-3 fw-bold">Class Schedule & Studio Sessions</h1>
              <p className="text-secondary small m-0 mt-1">
                Authentic classical yoga sessions led by certified yogacharyas. Join in-person or participate via live stream.
              </p>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="yoga-container">
        {/* Day Filter Bar */}
        <div className="day-filter-bar">
          <span className="text-muted fw-bold small d-flex align-items-center gap-1 me-2 text-nowrap">
            <MdFilterList /> Day:
          </span>
          {DAYS.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`btn btn-sm text-nowrap ${
                selectedDay === day ? "btn-primary" : "btn-secondary"
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        {/* Classes Cards Grid */}
        <div className="schedule-grid">
          <AnimatePresence>
            {filtered.map((cls, idx) => (
              <motion.div
                key={cls.id}
                className="schedule-card"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25, delay: idx * 0.03 }}
              >
                <div>
                  <div className="schedule-card-header">
                    <span className="badge-pill badge-primary">
                      {cls.day}
                    </span>
                    <span className="badge-pill badge-accent">
                      {cls.level}
                    </span>
                  </div>

                  <h4 className="schedule-card-title">{cls.title}</h4>

                  <div className="schedule-meta-list">
                    <div className="schedule-meta-row">
                      <MdAccessTime style={{ color: "var(--brand-primary)" }} size={16} />
                      <span>{cls.time}</span>
                    </div>
                    <div className="schedule-meta-row">
                      <MdPerson style={{ color: "var(--brand-primary)" }} size={16} />
                      <span>{cls.instructor}</span>
                    </div>
                    <div className="schedule-meta-row">
                      <MdLocationOn style={{ color: "var(--brand-primary)" }} size={16} />
                      <span>{cls.location}</span>
                    </div>
                  </div>
                </div>

                <div className="schedule-card-footer">
                  <span className="text-muted small">{cls.capacity}</span>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleBook(cls)}
                  >
                    <MdCalendarToday size={15} /> Reserve Spot
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Booking Modal / Mobile Drawer */}
        <AnimatePresence>
          {selectedClass && (
            <div className="ud-modal-backdrop">
              <motion.div
                className="ud-modal-content"
                style={{ maxWidth: 480 }}
                initial={{ scale: 0.95, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.95, y: 20, opacity: 0 }}
              >
                <div className="ud-modal-header">
                  <h5 className="fw-bold mb-0 fs-6 d-flex align-items-center gap-2">
                    <GiLotus style={{ color: "var(--brand-primary)" }} /> Reserve Session Spot
                  </h5>
                  <button
                    className="ud-modal-close-btn"
                    onClick={() => setSelectedClass(null)}
                    aria-label="Close"
                  >
                    <MdClose size={20} />
                  </button>
                </div>

                <div className="ud-modal-body">
                  {bookingSuccess ? (
                    <div className="text-center py-4">
                      <MdCheckCircle className="text-success mb-2" size={48} />
                      <h5 className="fw-bold text-success mb-1">Reservation Confirmed</h5>
                      <p className="text-muted small m-0">
                        Your spot for <strong>{selectedClass.title}</strong> has been secured.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={confirmBooking}>
                      <div className="p-3 rounded-3 mb-3 small" style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}>
                        <div className="fw-bold">{selectedClass.title}</div>
                        <div className="text-secondary mt-1">
                          {selectedClass.day} | {selectedClass.time}
                        </div>
                        <div className="text-muted">{selectedClass.instructor}</div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label small fw-bold">Full Name</label>
                        <input type="text" required className="form-control" placeholder="Enter your full name" />
                      </div>

                      <div className="mb-3">
                        <label className="form-label small fw-bold">Email Address</label>
                        <input type="email" required className="form-control" placeholder="name@example.com" />
                      </div>

                      <div className="d-flex gap-2 justify-content-end pt-2">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setSelectedClass(null)}
                        >
                          Cancel
                        </button>
                        <button type="submit" className="btn btn-primary btn-sm">
                          Confirm Reservation
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Classes;
