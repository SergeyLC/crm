import { Appointment, CreateAppointmentDTO, UpdateAppointmentDTO } from "@/entities/appointment";

export function sanitizeAppointments(
  appointments: (Appointment | CreateAppointmentDTO | UpdateAppointmentDTO)[]
): (Appointment | CreateAppointmentDTO | UpdateAppointmentDTO)[] {
  return appointments.filter((appointment) => {
    const { datetime, type, note } = appointment;
    return datetime || type || note;
  });
}
