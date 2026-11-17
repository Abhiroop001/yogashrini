import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../inc/Navbar";
import Footer from "../inc/Footer";
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
    <>
      <Navbar />

      {/* Hero */}
      <motion.header
        className="ud-hero classes-hero mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="ud-hero-inner container">
          <div className="ud-hero-left">
            <GiMeditation size={72} className="posture-hero-icon" style={{ color: "var(--yoga-primary, #FF2D6F)" }} />
            <div className="ud-hero-title-wrap">
              <h1 className="ud-title">Class Schedule & Studio Sessions</h1>
              <p className="ud-subtitle">
                Authentic classical yoga sessions led by certified yogacharyas. Join in-person at our sanctuary or
                participate via live interactive streaming.
              </p>
              <div className="posture-hero-badges">
                <span className="posture-badge">Daily In-Studio</span>
                <span className="posture-badge">Hybrid Streaming</span>
                <span className="posture-badge">Small Group Mentorship</span>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="container pb-5">
        {/* Day Filter Pills */}
        <div className="d-flex align-items-center gap-2 overflow-auto pb-3 mb-4 flex-nowrap">
          <span className="text-muted fw-bold d-flex align-items-center gap-1 me-2 text-nowrap">
            <MdFilterList /> Filter by Day:
          </span>
          {DAYS.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`btn btn-sm rounded-pill px-3 py-1 text-nowrap ${
                selectedDay === day ? "btn-primary shadow-sm" : "btn-outline-secondary"
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        {/* Classes Table / Cards */}
        <div className="row g-4">
          <AnimatePresence>
            {filtered.map((cls, idx) => (
              <motion.div
                key={cls.id}
                className="col-12 col-md-6 col-lg-4"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: idx * 0.04 }}
              >
                <div className="card h-100 border-0 shadow-sm rounded-4 p-4 d-flex flex-column justify-content-between hover-lift">
                  <div>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-1 rounded-pill small fw-bold">
                        {cls.day}
                      </span>
                      <span className="badge bg-light text-secondary border px-2 py-1 rounded-pill small">
                        {cls.level}
                      </span>
                    </div>

                    <h5 className="fw-bold mb-2 text-dark">{cls.title}</h5>

                    <div className="text-muted small mb-3 d-flex flex-column gap-2">
                      <div className="d-flex align-items-center gap-2">
                        <MdAccessTime className="text-primary" /> {cls.time}
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <MdPerson className="text-primary" /> {cls.instructor}
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <MdLocationOn className="text-primary" /> {cls.location}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-top d-flex justify-content-between align-items-center">
                    <span className="text-muted small">{cls.capacity}</span>
                    <button
                      className="btn btn-outline-primary btn-sm rounded-pill px-3 d-flex align-items-center gap-1"
                      onClick={() => handleBook(cls)}
                    >
                      <MdCalendarToday /> Reserve Spot
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Booking Modal */}
        <AnimatePresence>
          {selectedClass && (
            <motion.div
              className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50"
              style={{ zIndex: 1050 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white rounded-4 shadow-lg p-4 m-3"
                style={{ maxWidth: "480px", width: "100%" }}
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
              >
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                    <GiLotus className="text-primary" /> Reserve Session Spot
                  </h5>
                  <button
                    className="btn btn-sm btn-light rounded-circle"
                    onClick={() => setSelectedClass(null)}
                  >
                    <MdClose />
                  </button>
                </div>

                {bookingSuccess ? (
                  <div className="text-center py-4">
                    <MdCheckCircle className="text-success mb-2" size={48} />
                    <h5 className="fw-bold text-success">Reservation Confirmed</h5>
                    <p className="text-muted small">
                      Your spot for <strong>{selectedClass.title}</strong> has been secured. A confirmation email has been
                      dispatched.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={confirmBooking}>
                    <div className="p-3 bg-light rounded-3 mb-3 small">
                      <div className="fw-bold text-dark">{selectedClass.title}</div>
                      <div className="text-muted">
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
                        className="btn btn-light rounded-pill px-3"
                        onClick={() => setSelectedClass(null)}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary rounded-pill px-4">
                        Confirm Reservation
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <Footer />
    </>
  );
};

export default Classes;
