

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import api from "../api/axios";

const AuthContext = createContext(null);

// 30 minutes
const INACTIVITY_LIMIT = 30 * 60 * 1000;

// Prevent high-frequency events such as mousemove
// from constantly resetting the timer.
const ACTIVITY_THROTTLE = 1000;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const inactivityTimerRef = useRef(null);
  const lastActivityRef = useRef(0);

  // ---------------------------------------------------------
  // LOGOUT
  // ---------------------------------------------------------
  const logout = () => {
    localStorage.removeItem("access_token");
    sessionStorage.removeItem("admin_last_activity");

    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }

    setUser(null);
  };

  // ---------------------------------------------------------
  // RESET ADMIN INACTIVITY TIMER
  // ---------------------------------------------------------
  const resetInactivityTimer = () => {
    if (user?.role !== "admin") {
      return;
    }

    const now = Date.now();

    // Throttle frequent events such as mousemove/scroll
    if (
      lastActivityRef.current &&
      now - lastActivityRef.current < ACTIVITY_THROTTLE
    ) {
      return;
    }

    lastActivityRef.current = now;

    sessionStorage.setItem(
      "admin_last_activity",
      String(now)
    );

    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    inactivityTimerRef.current = setTimeout(() => {
      logout();
    }, INACTIVITY_LIMIT);
  };

  // ---------------------------------------------------------
  // CHECK EXISTING TOKEN ON APP START
  // ---------------------------------------------------------
  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get("/auth/me")
      .then((res) => {
        setUser(res.data);
      })
      .catch(() => {
        localStorage.removeItem("access_token");
        sessionStorage.removeItem("admin_last_activity");
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // ---------------------------------------------------------
  // LOGIN
  // ---------------------------------------------------------
  const login = async (email, password) => {
    const res = await api.post("/auth/login", {
      email,
      password,
    });

    localStorage.setItem(
      "access_token",
      res.data.access_token
    );

    setUser(res.data.user);

    // Start a fresh 30-minute inactivity period
    if (res.data.user?.role === "admin") {
      const now = Date.now();

      lastActivityRef.current = now;

      sessionStorage.setItem(
        "admin_last_activity",
        String(now)
      );
    }

    return res.data.user;
  };

  // ---------------------------------------------------------
  // ADMIN INACTIVITY HANDLER
  // ---------------------------------------------------------
  useEffect(() => {
    if (user?.role !== "admin") {
      return;
    }

    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    const handleActivity = () => {
      resetInactivityTimer();
    };

    const storedLastActivity = Number(
      sessionStorage.getItem("admin_last_activity") || 0
    );

    const now = Date.now();

    // -------------------------------------------------------
    // If admin was already inactive for 30+ minutes
    // -------------------------------------------------------
    if (
      storedLastActivity &&
      now - storedLastActivity >= INACTIVITY_LIMIT
    ) {
      logout();
      return;
    }

    // -------------------------------------------------------
    // Existing session without activity timestamp
    // -------------------------------------------------------
    if (!storedLastActivity) {
      const current = Date.now();

      lastActivityRef.current = current;

      sessionStorage.setItem(
        "admin_last_activity",
        String(current)
      );
    } else {
      lastActivityRef.current = storedLastActivity;
    }

    // -------------------------------------------------------
    // Calculate remaining time
    // -------------------------------------------------------
    const elapsed =
      Date.now() - lastActivityRef.current;

    const remaining = Math.max(
      INACTIVITY_LIMIT - elapsed,
      0
    );

    inactivityTimerRef.current = setTimeout(() => {
      logout();
    }, remaining);

    // -------------------------------------------------------
    // Listen for admin activity
    // -------------------------------------------------------
    events.forEach((event) => {
      window.addEventListener(
        event,
        handleActivity,
        { passive: true }
      );
    });

    // -------------------------------------------------------
    // Cleanup
    // -------------------------------------------------------
    return () => {
      events.forEach((event) => {
        window.removeEventListener(
          event,
          handleActivity
        );
      });

      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
    };
  }, [user]);

  // ---------------------------------------------------------
  // PROVIDER
  // ---------------------------------------------------------
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAdmin: user?.role === "admin",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);








































// import { createContext, useContext, useEffect, useState } from "react";
// import api from "../api/axios";

// const AuthContext = createContext(null);

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   // on mount, if a token exists, validate it against /auth/me
//   useEffect(() => {
//     const token = localStorage.getItem("access_token");
//     if (!token) {
//       setLoading(false);
//       return;
//     }
//     api
//       .get("/auth/me")
//       .then((res) => setUser(res.data))
//       .catch(() => {
//         localStorage.removeItem("access_token");
//       })
//       .finally(() => setLoading(false));
//   }, []);

//   const login = async (email, password) => {
//     const res = await api.post("/auth/login", { email, password });
//     localStorage.setItem("access_token", res.data.access_token);
//     setUser(res.data.user);
//     return res.data.user;
//   };

//   const logout = () => {
//     localStorage.removeItem("access_token");
//     setUser(null);
//   };

//   return (
//     <AuthContext.Provider value={{ user, loading, login, logout, isAdmin: user?.role === "admin" }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export const useAuth = () => useContext(AuthContext);
