"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
} from "lucide-react";

import {
  Button,
  Card,
  CardContent,
  LoadingState,
  PageHeader,
  Select,
} from "@/shared/components";

import {
  useCancelSlot,
  useCreateSlot,
  useMyAvailability,
  useMyMeetings,
  useUpdateSlot,
} from "../hooks";
import type { MentorAvailabilitySlotDto } from "../types";
import type {
  AvailabilityCalendarEvent,
  CalendarStatusFilter,
  CalendarView,
  ConfirmAction,
  SlotFormState,
} from "./availability-calendar.types";
import {
  DAY_COUNT,
  addDays,
  addMonths,
  createCalendarEvents,
  createSlotPayload,
  errorPanelClassName,
  formatCalendarHeading,
  formatDateTime,
  formatWeekRange,
  getDateKey,
  getErrorMessage,
  pageClassName,
  startOfMonth,
  startOfWeek,
  updateSlotPayload,
} from "./availability-calendar.utils";
import { AvailabilityDayTimeline } from "./availability-day-timeline";
import { AvailabilityWeekTimeline } from "./availability-week-timeline";
import { ConfirmDialog } from "./confirm-dialog";
import { MiniMonthCalendar } from "./mini-month-calendar";
import { SelectedEventPanel } from "./selected-event-panel";
import { SlotDetailsDialog } from "./slot-details-dialog";
import { SlotFormModal } from "./slot-form-modal";

export function MentorAvailabilityPage() {
  const [statusFilter, setStatusFilter] =
    useState<CalendarStatusFilter>("");
  const [modal, setModal] = useState<
    "create" | "details" | "duplicate" | "edit" | null
  >(null);
  const [selectedEvent, setSelectedEvent] =
    useState<AvailabilityCalendarEvent | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [calendarView, setCalendarView] = useState<CalendarView>("WEEK");
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [calendarMonth, setCalendarMonth] = useState(() =>
    startOfMonth(new Date()),
  );
  const [selectedDateKey, setSelectedDateKey] = useState(() =>
    getDateKey(new Date()),
  );

  const availabilityQuery = useMyAvailability();
  const meetingsQuery = useMyMeetings();
  const createSlotMutation = useCreateSlot();
  const updateSlotMutation = useUpdateSlot();
  const cancelSlotMutation = useCancelSlot();
  const selectedSlot =
    selectedEvent?.kind === "SLOT" ? selectedEvent.slot : null;

  const availableSlots = useMemo(
    () =>
      (availabilityQuery.data?.data ?? []).filter(
        (slot) => slot.status === "AVAILABLE",
      ),
    [availabilityQuery.data?.data],
  );

  const calendarEvents = useMemo(
    () =>
      createCalendarEvents(
        availabilityQuery.data?.data ?? [],
        meetingsQuery.data?.data ?? [],
      ),
    [availabilityQuery.data?.data, meetingsQuery.data?.data],
  );

  const filteredEvents = useMemo(() => {
    return statusFilter
      ? calendarEvents.filter((event) => event.status === statusFilter)
      : calendarEvents;
  }, [calendarEvents, statusFilter]);

  async function handleCreateSlot(form: SlotFormState) {
    await createSlotMutation.mutateAsync(createSlotPayload(form));
  }

  async function handleUpdateSlot(form: SlotFormState) {
    if (!selectedSlot) return;

    await updateSlotMutation.mutateAsync({
      payload: updateSlotPayload(form),
      slotId: selectedSlot.id,
    });
  }

  function requestCancelSlot(slot: MentorAvailabilitySlotDto) {
    setConfirmAction({
      confirmLabel: "Cancel slot",
      description: `Cancel the availability slot starting ${formatDateTime(
        slot.startAt,
      )}.`,
      onConfirm: () => cancelSlotMutation.mutateAsync(slot.id),
      title: "Cancel availability slot",
    });
  }

  function requestCancelAvailableSlots() {
    setConfirmAction({
      confirmLabel: "Cancel available slots",
      description: `Cancel all ${availableSlots.length} currently available slots?`,
      onConfirm: () =>
        Promise.all(
          availableSlots.map((slot) => cancelSlotMutation.mutateAsync(slot.id)),
        ),
      title: "Cancel available slots",
    });
  }

  function selectCalendarDate(date: Date) {
    setSelectedDateKey(getDateKey(date));
    setWeekStart(startOfWeek(date));
    setCalendarMonth(startOfMonth(date));
    setSelectedEvent(null);
  }

  function moveWeek(direction: -1 | 1) {
    const currentSelectedDate = new Date(`${selectedDateKey}T12:00:00`);
    const nextWeekStart = addDays(weekStart, direction * DAY_COUNT);

    setWeekStart(nextWeekStart);
    setSelectedDateKey(
      getDateKey(addDays(currentSelectedDate, direction * DAY_COUNT)),
    );
    setCalendarMonth(startOfMonth(nextWeekStart));
    setSelectedEvent(null);
  }

  function moveDay(direction: -1 | 1) {
    const currentDate = new Date(`${selectedDateKey}T12:00:00`);
    selectCalendarDate(addDays(currentDate, direction));
  }

  function showToday() {
    const today = new Date();
    selectCalendarDate(today);
  }

  function moveMonth(direction: -1 | 1) {
    setCalendarMonth((currentMonth) => addMonths(currentMonth, direction));
  }

  const selectedDate = new Date(`${selectedDateKey}T12:00:00`);
  const isWeekView = calendarView === "WEEK";

  return (
    <div className={pageClassName}>
      <PageHeader
        actions={
          availableSlots.length > 0 ? (
            <Button
              icon={<Trash2 size={16} />}
              onClick={requestCancelAvailableSlots}
              variant="secondary"
            >
              Cancel available
            </Button>
          ) : undefined
        }
        description="Create, update, and cancel availability slots that assigned groups can book."
        eyebrow="Mentor"
        title="Availability"
      />

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-4 border-b border-border p-4 min-[761px]:p-5">
          <div className="grid min-w-0 gap-0.5">
            <span className="text-[10px] font-bold tracking-[0.08em] text-muted uppercase">
              {isWeekView ? "Week view" : "Day view"}
            </span>
            <strong className="truncate text-base text-foreground min-[481px]:text-lg">
              {isWeekView
                ? formatWeekRange(weekStart)
                : formatCalendarHeading(selectedDate)}
            </strong>
          </div>

          <div className="ml-auto flex min-w-0 flex-wrap items-center gap-2">
            <div
              aria-label="Calendar view"
              className="flex shrink-0 items-center gap-1 rounded-xl border border-border bg-surface p-1"
              role="group"
            >
              {(["WEEK", "DAY"] as const).map((view) => (
                <Button
                  aria-pressed={calendarView === view}
                  className="min-w-14 px-2"
                  key={view}
                  onClick={() => setCalendarView(view)}
                  size="sm"
                  variant={calendarView === view ? "secondary" : "ghost"}
                >
                  {view === "WEEK" ? "Week" : "Day"}
                </Button>
              ))}
            </div>
            <div className="flex shrink-0 items-center gap-1 rounded-xl border border-border bg-surface p-1">
              <Button
                aria-label={`Previous ${isWeekView ? "week" : "day"}`}
                className="size-9 px-0"
                icon={<ChevronLeft size={17} />}
                onClick={() => (isWeekView ? moveWeek(-1) : moveDay(-1))}
                size="sm"
                variant="ghost"
              >
                <span className="sr-only">
                  Previous {isWeekView ? "week" : "day"}
                </span>
              </Button>
              <Button
                aria-label={`Next ${isWeekView ? "week" : "day"}`}
                className="size-9 px-0"
                icon={<ChevronRight size={17} />}
                onClick={() => (isWeekView ? moveWeek(1) : moveDay(1))}
                size="sm"
                variant="ghost"
              >
                <span className="sr-only">
                  Next {isWeekView ? "week" : "day"}
                </span>
              </Button>
            </div>
            <Button
              icon={<CalendarDays size={16} />}
              onClick={showToday}
              size="sm"
              variant="secondary"
            >
              Today
            </Button>
            <Select
              aria-label="Filter availability by status"
              fieldClassName="w-[150px]"
              shellClassName="h-10"
              value={statusFilter}
              onChange={(event) => {
                setSelectedEvent(null);
                setStatusFilter(event.target.value as CalendarStatusFilter);
              }}
            >
              <option value="">All statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="COMPLETED">Completed</option>
            </Select>
            <Button
              icon={<Plus size={16} />}
              onClick={() => {
                setSelectedEvent(null);
                setModal("create");
              }}
              size="sm"
            >
              Add event
            </Button>
          </div>
        </div>

        {availabilityQuery.isLoading || meetingsQuery.isLoading ? (
          <CardContent>
            <LoadingState title="Loading calendar" />
          </CardContent>
        ) : availabilityQuery.isError || meetingsQuery.isError ? (
          <CardContent>
            <div className={errorPanelClassName}>
              {getErrorMessage(
                availabilityQuery.error ?? meetingsQuery.error,
              )}
            </div>
          </CardContent>
        ) : (
          <div className="grid min-w-0 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="flex min-h-0 min-w-0 flex-col p-4 min-[761px]:p-6">
              {isWeekView ? (
                <AvailabilityWeekTimeline
                  events={filteredEvents}
                  onSelectDate={selectCalendarDate}
                  onSelectEvent={(event) => {
                    selectCalendarDate(new Date(event.startAt));
                    setSelectedEvent(event);
                    setModal(event.kind === "SLOT" ? "details" : null);
                  }}
                  weekStart={weekStart}
                />
              ) : (
                <AvailabilityDayTimeline
                  date={selectedDate}
                  events={filteredEvents}
                  onSelectEvent={(event) => {
                    setSelectedEvent(event);
                    setModal(event.kind === "SLOT" ? "details" : null);
                  }}
                />
              )}
            </div>
            <aside className="min-w-0 border-t border-border lg:border-t-0 lg:border-l">
              <MiniMonthCalendar
                calendarMonth={calendarMonth}
                events={filteredEvents}
                onMoveMonth={moveMonth}
                onSelectDate={selectCalendarDate}
                selectedDateKey={selectedDateKey}
              />
              <SelectedEventPanel
                event={selectedEvent}
                onViewSlotDetails={() => setModal("details")}
              />
            </aside>
          </div>
        )}
      </Card>

      {modal === "details" && selectedSlot && (
        <SlotDetailsDialog
          onCancel={() => {
            setModal(null);
            requestCancelSlot(selectedSlot);
          }}
          onClose={() => {
            setModal(null);
            setSelectedEvent(null);
          }}
          onDuplicate={() => setModal("duplicate")}
          onEdit={() => setModal("edit")}
          slot={selectedSlot}
        />
      )}

      {modal === "create" && (
        <SlotFormModal
          mode="create"
          onClose={() => setModal(null)}
          onSubmit={handleCreateSlot}
        />
      )}

      {modal === "duplicate" && selectedSlot && (
        <SlotFormModal
          mode="duplicate"
          onClose={() => {
            setModal(null);
            setSelectedEvent(null);
          }}
          onSubmit={handleCreateSlot}
          slot={selectedSlot}
        />
      )}

      {modal === "edit" && selectedSlot && (
        <SlotFormModal
          mode="edit"
          onClose={() => {
            setModal(null);
            setSelectedEvent(null);
          }}
          onSubmit={handleUpdateSlot}
          slot={selectedSlot}
        />
      )}

      {confirmAction && (
        <ConfirmDialog
          action={confirmAction}
          onClose={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}
