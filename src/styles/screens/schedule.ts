import { StyleSheet } from 'react-native';
import { colors } from '../colors';
import { fonts, fontSizes, lineHeights } from '../fonts';

export const scheduleStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes['2xl'],
    color: colors.surface,
  },
  viewSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 4,
  },
  viewButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  viewButtonActive: {
    backgroundColor: colors.surface,
  },
  viewButtonText: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
  },
  viewButtonTextActive: {
    color: colors.primary,
  },
  viewButtonTextInactive: {
    color: colors.surface,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 12,
    marginTop: 16,
  },
  dateButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  currentDate: {
    alignItems: 'center',
  },
  dateText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
  },
  dayText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  calendarContainer: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  calendarTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
  },
  calendarGrid: {
    flex: 1,
  },
  calendarRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  calendarCell: {
    flex: 1,
    minHeight: 60,
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  calendarCellLast: {
    borderRightWidth: 0,
  },
  calendarCellHeader: {
    alignItems: 'center',
    marginBottom: 4,
  },
  calendarCellDay: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  calendarCellNumber: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.base,
    color: colors.primaryLight,
  },
  calendarCellToday: {
    backgroundColor: colors.primaryLight,
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarCellTodayText: {
    color: colors.primary,
  },
  calendarCellOtherMonth: {
    opacity: 0.5,
  },
  appointmentSlot: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 8,
    marginBottom: 4,
    borderLeftColor: colors.success,
  },
  appointmentSlotBusy: {
    backgroundColor: colors.background,
    borderLeftColor: colors.error,
  },
  appointmentTime: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    color: colors.success,
  },
  appointmentTimeBusy: {
    color: colors.error,
  },
  appointmentService: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: colors.textPrimary,
  },
  listContainer: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  listHeader: {
    backgroundColor: colors.surface,
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes['2xl'],
    color: colors.textPrimary,
    marginBottom: 8,
  },
  listSubtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterButtonText: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  filterButtonTextActive: {
    color: colors.surface,
  },
  appointmentItem: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 24,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  appointmentItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  appointmentItemClient: {
    flex: 1,
    marginRight: 12,
  },
  appointmentItemName: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  appointmentItemService: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  appointmentItemTime: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.base,
    color: colors.primary,
  },
  appointmentItemStatus: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  appointmentItemStatusText: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
  },
  appointmentItemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  appointmentItemDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appointmentItemDetailText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginLeft: 6,
  },
  appointmentItemActions: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});