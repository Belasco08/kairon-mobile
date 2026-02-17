import { useState, useCallback, useMemo } from "react";
import { appointmentService, Appointment, AppointmentStatus } from "../services/appointments";
import { useAuth } from "./useAuth";
import { useCompany } from "./useCompany";

/* =======================
   STATS
======================= */

interface AppointmentStats {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  noShow: number;
  revenue: number;
}

/* =======================
   BUILD STATS
======================= */

function buildStats(appointments: Appointment[]): AppointmentStats {
  const total = appointments.length;

  const pending = appointments.filter(a => a.status === "PENDING").length;
  const confirmed = appointments.filter(a => a.status === "CONFIRMED").length;
  const completed = appointments.filter(a => a.status === "COMPLETED").length;
  const cancelled = appointments.filter(a => a.status === "CANCELLED").length;
  const noShow = appointments.filter(a => a.status === "NO_SHOW").length;

  const revenue = appointments.reduce(
    (acc, a) => acc + (a.actualPrice ?? a.totalPrice ?? 0),
    0
  );

  return {
    total,
    pending,
    confirmed,
    completed,
    cancelled,
    noShow,
    revenue,
  };
}

/* =======================
   HOOK
======================= */

export function useAppointments() {
  const { user } = useAuth();
  const { company } = useCompany();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<AppointmentStats | null>(null);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);

  /* =======================
     LOAD
  ======================= */

  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {};
      if (company?.id) params.companyId = company.id;
      if (user?.role === "STAFF") params.professionalId = user.id;

      const list = await appointmentService.list(params);

      setAppointments(list);
      setStats(buildStats(list));
    } catch (err) {
      console.error(err);
      setError("Não foi possível carregar os agendamentos");
    } finally {
      setLoading(false);
    }
  }, [company?.id, user?.id, user?.role]);

  /* =======================
     UPDATE STATUS
  ======================= */

  const updateStatus = useCallback(
    async (
      id: string,
      status: AppointmentStatus,
      reason?: string
    ) => {
      setLoading(true);
      try {
        const updated = await appointmentService.updateStatus(id, {
          status,
          ...(reason ? { reason } : {}),
        });

        setAppointments(prev => {
          const updatedList = prev.map(a =>
            a.id === id ? updated : a
          );
          setStats(buildStats(updatedList));
          return updatedList;
        });

        setSelectedAppointment(prev =>
          prev?.id === id ? updated : prev
        );

        return updated;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /* =======================
     COMPUTEDS
  ======================= */

  const upcomingAppointments = useMemo(() => {
    return appointments.filter(a => a.status === "PENDING");
  }, [appointments]);

  return {
    loading,
    error,
    appointments,
    stats,
    selectedAppointment,
    upcomingAppointments,

    loadAppointments,
    updateStatus,
    setSelectedAppointment,
    setError,
  };
}
