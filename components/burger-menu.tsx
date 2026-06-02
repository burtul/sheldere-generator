"use client"

import { useState, useEffect, useRef } from "react"
import type { ScheduleData, GlobalSettings } from "@/lib/types"
import { isValidDate, isDateStringValid } from "@/lib/utils"
import { Button, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, Box, Divider, TextField, Switch, Checkbox as MuiCheckbox, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel } from "@mui/material"
import { Palette as PaletteIcon, Calculate as CalculatorIcon, Close as CloseIcon, Note as NoteIcon, Logout as LogoutIcon, Visibility as VisibilityIcon, DarkMode as DarkModeIcon, LightMode as LightModeIcon, Delete as DeleteIcon, Info as InfoIcon, BarChart as BarChartIcon, List as ListIcon, Menu as MenuIcon, ArrowBack as ArrowBackIcon, Work as WorkIcon, Schedule as ScheduleIcon, BeachAccess as BeachAccessIcon } from "@mui/icons-material"
import { ThemeProvider, createTheme } from "@mui/material/styles"
import VacationDialog from "./vacation-dialog"
import { calculateVacationDaysWithHolidays } from "@/lib/vacation-utils"

const drawerTransitionDuration = {
  enter: 320,
  exit: 260,
}

const swipeCloseThreshold = 70
const swipeDirectionLockThreshold = 12

interface BurgerMenuProps {
  isOpen: boolean
  isClosing: boolean
  scheduleData: ScheduleData
  onClose: () => void
  onBackdropClick: (e: React.MouseEvent) => void
  onGlobalSettingsSave: (settings: GlobalSettings) => void
  onGlobalNotesSave: (notes: string) => void
  onVisibilitySettingsSave?: (settings: { showShiftInfo: boolean; showMonthProgress: boolean; showTodoList: boolean }) => void
  visibilitySettings?: { showShiftInfo: boolean; showMonthProgress: boolean; showTodoList: boolean }
  onScheduleTypeChange?: (scheduleType: "2x2" | "5days") => void
  currentScheduleType?: "2x2" | "5days"
  vacations?: { startDate: Date; days: number; isVisible?: boolean }[]
  onVacationSave?: (vacation: { startDate: Date; days: number }) => void
  onVacationDelete?: (index: number) => void
  onToggleVacation?: (index: number, isVisible: boolean) => void
  showWorkShiftsDuringVacation?: boolean
  onShowWorkShiftsDuringVacationChange?: (value: boolean) => void
}

export default function BurgerMenu({
  isOpen,
  isClosing,
  scheduleData,
  onClose,
  onGlobalSettingsSave,
  onGlobalNotesSave,
  onVisibilitySettingsSave,
  visibilitySettings = { showShiftInfo: true, showMonthProgress: true, showTodoList: true },
  onScheduleTypeChange,
  currentScheduleType = "2x2",
  onVacationSave,
  onVacationDelete,
  onToggleVacation,
  vacations = [],
  showWorkShiftsDuringVacation = false,
  onShowWorkShiftsDuringVacationChange,
}: BurgerMenuProps) {
  const { globalSettings } = scheduleData;
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null)
  const swipeIsBackdropRef = useRef(false)
  const [activeSection, setActiveSection] = useState<"main" | "colors" | "salary" | "visibility" | "schedule" | "vacation">("main")
  const [baseDate, setBaseDate] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('baseDate');
      const defaultBaseDate = new Date(2025, 0, 1).toISOString().split('T')[0];
      // Проверяем формат YYYY-MM-DD и валидность даты
      return stored && isDateStringValid(stored) && isValidDate(new Date(stored)) ? stored : globalSettings.baseDate?.toISOString().split('T')[0] || defaultBaseDate;
    }
    // Серверный рендер - используем дефолтную дату
    return globalSettings.baseDate?.toISOString().split('T')[0] || new Date(2025, 0, 1).toISOString().split('T')[0];
  })

  // Синхронизация с globalSettings
  useEffect(() => {
    if (globalSettings.baseDate) {
      setBaseDate(globalSettings.baseDate.toISOString().split('T')[0]);
    }
  }, [globalSettings.baseDate]);
  const [dayColor, setDayColor] = useState(scheduleData.globalSettings.dayShiftColor)
  const [nightColor, setNightColor] = useState(scheduleData.globalSettings.nightShiftColor)
  const [offColor, setOffColor] = useState(scheduleData.globalSettings.offShiftColor)
  const [workColor, setWorkColor] = useState(scheduleData.globalSettings.dayShiftColor)
  const [customNumber, setCustomNumber] = useState<string>(scheduleData.globalSettings.customNumber?.toString() || "")
  const [localVisibilitySettings, setLocalVisibilitySettings] = useState(visibilitySettings)
  const [darkMode, setDarkMode] = useState(false)
  const [openClearDialog, setOpenClearDialog] = useState(false)
  const [localScheduleType, setLocalScheduleType] = useState(currentScheduleType)
  const [openVacationDialog, setOpenVacationDialog] = useState(false)


  const colorPresets = {
    day: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"],
    night: ["#6b7280", "#1f2937", "#4f46e5", "#7c3aed", "#06b6d4"]
  }

  useEffect(() => {
    if (isOpen) {
      setActiveSection("main")
    }
  }, [isOpen])

  useEffect(() => {
    setLocalVisibilitySettings(visibilitySettings)
  }, [visibilitySettings])

  useEffect(() => {
    setLocalScheduleType(currentScheduleType)
    if (currentScheduleType === "5days") {
      setWorkColor(dayColor)
    }
  }, [currentScheduleType, dayColor]) // Added dayColor dependency

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      setDarkMode(savedTheme === 'dark')
      document.documentElement.classList.toggle('dark', savedTheme === 'dark')
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('theme', darkMode ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: darkMode ? '#D0BCFF' : '#6750A4',
      },
      secondary: {
        main: darkMode ? '#CCC2DC' : '#625B71',
      },
      background: {
        default: darkMode ? '#161211' : '#FFF8F4',
        paper: darkMode ? '#161211' : '#FFF8F4',
      },
      text: {
        primary: darkMode ? '#EBE0DD' : '#201A19',
        secondary: darkMode ? '#CAC4D0' : '#49454F',
      },
    },
  })

  const handleSaveSettings = () => {
    const trimmedValue = customNumber.trim()
    const numValue = trimmedValue === "" ? undefined : parseFloat(trimmedValue)

    onGlobalSettingsSave({
      dayShiftColor: localScheduleType === "2x2" ? dayColor : workColor,
      nightShiftColor: nightColor,
      offShiftColor: offColor,
      customNumber: numValue !== undefined && !isNaN(numValue) ? numValue : undefined,
    })
    setActiveSection("main")
  }

  const handleOpenGlobalNotes = () => {
    onGlobalNotesSave("")
    onClose()
  }

  const handleExitApp = async () => {
    try {
      if (typeof window !== 'undefined' && window.Capacitor) {
        const { App } = await import('@capacitor/app');
        await App.exitApp();
      } else {
        window.close();
      }
    } catch (error) {
      console.error('Failed to exit app:', error);
    }
  }

  const handleVisibilityChange = (key: keyof typeof localVisibilitySettings) => {
    const newSettings = {
      ...localVisibilitySettings,
      [key]: !localVisibilitySettings[key]
    }
    setLocalVisibilitySettings(newSettings)
    if (onVisibilitySettingsSave) {
      onVisibilitySettingsSave(newSettings)
    }
  }

  const handleThemeToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation()
    setDarkMode(!darkMode)
  }

  const handleScheduleTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newType = event.target.value as "2x2" | "5days"
    setLocalScheduleType(newType)
    if (onScheduleTypeChange) {
      onScheduleTypeChange(newType)
    }
  }

  const handleClearUserData = () => {
    localStorage.clear()
    window.location.reload()
  }

  const handleOpenClearDialog = () => {
    setOpenClearDialog(true)
  }

  const handleCloseClearDialog = () => {
    setOpenClearDialog(false)
  }

  const handleSwipeStart = (event: React.TouchEvent, isBackdrop = false) => {
    const touch = event.touches[0]
    swipeStartRef.current = touch ? { x: touch.clientX, y: touch.clientY } : null
    swipeIsBackdropRef.current = isBackdrop
  }

  const handleSwipeMove = (event: React.TouchEvent) => {
    const start = swipeStartRef.current
    const touch = event.touches[0]
    if (!start || !touch || isClosing) return

    const deltaX = touch.clientX - start.x
    const deltaY = touch.clientY - start.y
    const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > swipeDirectionLockThreshold

    if (isHorizontalSwipe) {
      event.preventDefault()
    }
  }

  const handleSwipeEnd = (event: React.TouchEvent) => {
    const start = swipeStartRef.current
    const touch = event.changedTouches[0]
    const isBackdrop = swipeIsBackdropRef.current
    swipeStartRef.current = null
    swipeIsBackdropRef.current = false
    if (!start || !touch || isClosing) return

    const deltaX = touch.clientX - start.x
    const deltaY = touch.clientY - start.y
    const isCloseSwipe =
      deltaX <= -swipeCloseThreshold && Math.abs(deltaX) > Math.abs(deltaY) * 1.25
    const isBackGestureOnBackdrop =
      isBackdrop && deltaX >= swipeCloseThreshold && Math.abs(deltaX) > Math.abs(deltaY) * 1.25

    if (isCloseSwipe || isBackGestureOnBackdrop) {
      onClose()
    }
  }

  if (!isOpen) return null

  const getColorsMenuText = () => {
    if (localScheduleType === "2x2") {
      return "Цвета смен (бригады)"
    } else {
      return "Цвета смен (рабочие/выходные)"
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <Drawer
        anchor="left"
        open={isOpen && !isClosing}
        onClose={onClose}
        transitionDuration={drawerTransitionDuration}
        slotProps={{
          root: {
            onTouchStart: handleSwipeStart,
            onTouchMove: handleSwipeMove,
            onTouchEnd: handleSwipeEnd,
            onTouchCancel: () => {
              swipeStartRef.current = null
              swipeIsBackdropRef.current = false
            },
            sx: {
              touchAction: 'pan-y',
            },
          },
          transition: {
            easing: {
              enter: theme.transitions.easing.easeOut,
              exit: theme.transitions.easing.sharp,
            },
          },
          backdrop: {
            onTouchStart: (event: React.TouchEvent) => handleSwipeStart(event, true),
            onTouchMove: handleSwipeMove,
            onTouchEnd: handleSwipeEnd,
            onTouchCancel: () => {
              swipeStartRef.current = null
              swipeIsBackdropRef.current = false
            },
            sx: {
              touchAction: 'pan-y',
              transition: theme.transitions.create('opacity', {
                duration: drawerTransitionDuration.enter,
                easing: theme.transitions.easing.easeOut,
              }),
            },
          },
        }}
        PaperProps={{
          sx: {
            width: {
              xs: 280,
              sm: 320,
            },
            maxWidth: '100%',
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            willChange: 'transform',
            touchAction: 'pan-y',
          }
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            opacity: isClosing ? 0 : 1,
            transform: isClosing ? 'translateX(-8px)' : 'translateX(0)',
            transition: theme.transitions.create(['opacity', 'transform'], {
              duration: isClosing ? 180 : 260,
              easing: isClosing ? theme.transitions.easing.sharp : theme.transitions.easing.easeOut,
            }),
          }}
        >
          {/* Header */}
          <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {activeSection === "main" ? (
              <Typography variant="h6">Меню</Typography>
            ) : (
              <Button
                onClick={() => setActiveSection("main")}
                startIcon={<ArrowBackIcon />}
                sx={{ color: theme.palette.text.secondary }}
              >
                Назад
              </Button>
            )}
            <Button
              onClick={onClose}
              sx={{ minWidth: 'auto', p: 1, color: theme.palette.text.secondary }}
            >
              <CloseIcon />
            </Button>
          </Box>

          {/* Content */}
          <Box sx={{ p: 2, overflowY: 'auto', flexGrow: 1 }}>
            {activeSection === "main" && (
              <List>
                <ListItem disablePadding>
                  <ListItemButton onClick={() => setActiveSection("schedule")}>
                    <ListItemIcon>
                      <ScheduleIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Тип графика" secondary="Выбор графика работы" />
                  </ListItemButton>
                </ListItem>

                <ListItem disablePadding>
                  <ListItemButton onClick={() => setActiveSection("colors")}>
                    <ListItemIcon>
                      <PaletteIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={getColorsMenuText()} secondary="Настройка цветов" />
                  </ListItemButton>
                </ListItem>

                <ListItem disablePadding>
                  <ListItemButton onClick={() => setActiveSection("salary")}>
                    <ListItemIcon>
                      <CalculatorIcon color="success" />
                    </ListItemIcon>
                    <ListItemText primary="Оклад" secondary="Настройка оклада" />
                  </ListItemButton>
                </ListItem>

                <ListItem disablePadding>
                  <ListItemButton onClick={handleOpenGlobalNotes}>
                    <ListItemIcon>
                      <ListIcon color="warning" />
                    </ListItemIcon>
                    <ListItemText primary="Список дел" secondary="Редактировать список дел" />
                  </ListItemButton>
                </ListItem>

                <ListItem disablePadding>
                  <ListItemButton onClick={() => setActiveSection("visibility")}>
                    <ListItemIcon>
                      <VisibilityIcon color="secondary" />
                    </ListItemIcon>
                    <ListItemText primary="Видимость карточек" secondary="Управление отображением" />
                  </ListItemButton>
                </ListItem>

                {/* Vacation Section */}
                <ListItem disablePadding>
                  <ListItemButton onClick={() => setOpenVacationDialog(true)}>
                    <ListItemIcon>
                      <BeachAccessIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Отпуск" secondary="Добавить отпуск" />
                  </ListItemButton>
                </ListItem>

                {/* Theme Toggle */}
                <ListItem disablePadding>
                  <ListItemButton>
                    <ListItemIcon>
                      {darkMode ? <DarkModeIcon color="action" /> : <LightModeIcon color="action" />}
                    </ListItemIcon>
                    <ListItemText primary="Тема" secondary="Переключение темы" />
                  </ListItemButton>
                  <Switch
                    checked={darkMode}
                    onChange={handleThemeToggle}
                    color="primary"
                    edge="end"
                    sx={{ mr: 1 }}
                  />
                </ListItem>

                {/* Clear User Data */}
                <ListItem disablePadding>
                  <ListItemButton onClick={handleOpenClearDialog}>
                    <ListItemIcon>
                      <DeleteIcon color="error" />
                    </ListItemIcon>
                    <ListItemText primary="Очистить данные" secondary="Удалить все пользовательские данные" />
                  </ListItemButton>
                </ListItem>

                <ListItem disablePadding>
                  <ListItemButton onClick={handleExitApp}>
                    <ListItemIcon>
                      <LogoutIcon color="error" />
                    </ListItemIcon>
                    <ListItemText primary="Выйти" secondary="Закрыть приложение" />
                  </ListItemButton>
                </ListItem>
              </List>
            )}

            {/* Schedule Type Section */}
            {activeSection === "schedule" && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h6">Тип графика</Typography>
                <Typography variant="body2" color="text.secondary">
                  Выберите график работы
                </Typography>

                <FormControl component="fieldset">
                  <RadioGroup
                    aria-label="schedule-type"
                    name="schedule-type"
                    value={localScheduleType}
                    onChange={handleScheduleTypeChange}
                  >
                    <FormControlLabel
                      value="2x2"
                      control={<Radio />}
                      label="2 через 2 (12ч)"
                      sx={{ mb: 1 }}
                    />
                   <Typography variant="body2" color="text.secondary" sx={{ ml: 3, mb: 2 }}>
                     2 дн → 2 вых → 2 ноч → отс → вых
                   </Typography>

                   <FormControlLabel
                     value="5days"
                     control={<Radio />}
                     label="5 рабочих дней"
                     sx={{ mb: 1 }}
                   />
                   <Typography variant="body2" color="text.secondary" sx={{ ml: 3, mb: 2 }}>
                     5 рабочих дней (8h/8h15) → 2 вых
                   </Typography>

                   <Box sx={{ mt: 2, mb: 1 }}>
                     <Typography variant="subtitle1" gutterBottom>
                       Базовая дата графика
                     </Typography>
                     <TextField
                       type="date"
                       value={baseDate}
                       onChange={(e) => {
                         const newDate = e.target.value;
                         if (isDateStringValid(newDate) && isValidDate(new Date(newDate))) {
                           setBaseDate(newDate);
                           if (typeof window !== 'undefined') {
                             localStorage.setItem('baseDate', newDate);
                             // Триггерим событие для принудительного обновления графиков
                             window.dispatchEvent(new Event('baseDateChanged'));
                           }
                         } else {
                           console.error('Некорректный формат даты:', newDate);
                         }
                       }}
                       // Отображаем текущую базовую дату в формате YYYY-MM-DD
                       inputProps={{ min: "2023-01-01", max: "2030-12-31" }}
                       InputLabelProps={{ shrink: true }}
                       variant="outlined"
                       fullWidth
                       sx={{ mb: 1 }}
                     />
                     <Typography variant="caption" display="block" gutterBottom>
                       Текущая опорная дата с которой  начинается генерация графика
                     </Typography>
                   </Box>
                  </RadioGroup>
                </FormControl>
              </Box>
            )}

            {/* Colors Section */}
            {activeSection === "colors" && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h6">Цвета смен</Typography>

                {localScheduleType === "2x2" ? (
                  <>
                    <Box>
                      <Typography variant="subtitle1" gutterBottom>Цвет дневной смены</Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {colorPresets.day.map((color) => (
                          <Button
                            key={color}
                            onClick={() => setDayColor(color)}
                            sx={{
                              flex: 1,
                              minWidth: 'calc(20% - 8px)',
                              height: 48,
                              borderRadius: 1,
                              backgroundColor: color,
                              border: dayColor === color ? '2px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline)',
                              boxShadow: dayColor === color ? '0 0 0 2px var(--md-sys-color-primary)' : 'none',
                              transition: 'all 0.3s',
                              '&:hover': {
                                transform: 'scale(1.05)',
                              }
                            }}
                          />
                        ))}
                      </Box>
                    </Box>

                    <Box>
                      <Typography variant="subtitle1" gutterBottom>Цвет ночной смены</Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {colorPresets.night.map((color) => (
                          <Button
                            key={color}
                            onClick={() => setNightColor(color)}
                            sx={{
                              flex: 1,
                              minWidth: 'calc(20% - 8px)',
                              height: 48,
                              borderRadius: 1,
                              backgroundColor: color,
                              border: nightColor === color ? '2px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline)',
                              boxShadow: nightColor === color ? '0 0 0 2px var(--md-sys-color-primary)' : 'none',
                              transition: 'all 0.3s',
                              '&:hover': {
                                transform: 'scale(1.05)',
                              }
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  </>
                ) : (
                  <>
                    <Box>
                      <Typography variant="subtitle1" gutterBottom>Цвет рабочих дней</Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {colorPresets.day.map((color) => (
                          <Button
                            key={color}
                            onClick={() => setWorkColor(color)}
                            sx={{
                              flex: 1,
                              minWidth: 'calc(20% - 8px)',
                              height: 48,
                              borderRadius: 1,
                              backgroundColor: color,
                              border: workColor === color ? '2px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline)',
                              boxShadow: workColor === color ? '0 0 0 2px var(--md-sys-color-primary)' : 'none',
                              transition: 'all 0.3s',
                              '&:hover': {
                                transform: 'scale(1.05)',
                              }
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  </>
                )}

                <Box>
                  <Typography variant="subtitle1" gutterBottom>Цвет выходных</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {colorPresets.night.map((color) => (
                      <Button
                        key={color}
                        onClick={() => setOffColor(color)}
                        sx={{
                          flex: 1,
                          minWidth: 'calc(20% - 8px)',
                          height: 48,
                          borderRadius: 1,
                          backgroundColor: color,
                          border: offColor === color ? '2px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline)',
                          boxShadow: offColor === color ? '0 0 0 2px var(--md-sys-color-primary)' : 'none',
                          transition: 'all 0.3s',
                          '&:hover': {
                            transform: 'scale(1.05)',
                          }
                        }}
                      />
                    ))}
                  </Box>
                </Box>

                <Button
                  onClick={handleSaveSettings}
                  variant="contained"
                  color="primary"
                  sx={{ mt: 2 }}
                >
                  Сохранить цвета
                </Button>
              </Box>
            )}

            {/* Salary Section */}
            {activeSection === "salary" && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h6">Настройка оклада</Typography>

                <Box>
                  <Typography variant="subtitle1" gutterBottom>Оклад</Typography>
                  <TextField
                    type="number"
                    value={customNumber}
                    onChange={(e) => setCustomNumber(e.target.value)}
                    placeholder="Введите оклад"
                    variant="outlined"
                    fullWidth
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="caption" display="block" gutterBottom>
                    Для расчета аванса(учитываются часы до 16го числа)
                  </Typography>
                </Box>

                <Button
                  onClick={handleSaveSettings}
                  variant="contained"
                  color="primary"
                >
                  Сохранить оклад
                </Button>
              </Box>
            )}

            {/* Visibility Section */}
            {activeSection === "visibility" && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h6">Видимость карточек</Typography>
                <Typography variant="body2" color="text.secondary">
                  Управляйте отображением карточек на главном экране
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ width: 32, height: 32, backgroundColor: theme.palette.primary.main, borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <InfoIcon sx={{ color: theme.palette.primary.contrastText }} />
                      </Box>
                      <Box>
                        <Typography variant="subtitle1">Информация о смене</Typography>
                        <Typography variant="body2" color="text.secondary">Карточка с деталями текущей смены</Typography>
                      </Box>
                    </Box>
                    <MuiCheckbox
                      checked={localVisibilitySettings.showShiftInfo}
                      onChange={() => handleVisibilityChange('showShiftInfo')}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ width: 32, height: 32, backgroundColor: theme.palette.secondary.main, borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <BarChartIcon sx={{ color: theme.palette.secondary.contrastText }} />
                      </Box>
                      <Box>
                        <Typography variant="subtitle1">Прогресс месяца</Typography>
                        <Typography variant="body2" color="text.secondary">Карточка с прогрессом за месяц</Typography>
                      </Box>
                    </Box>
                    <MuiCheckbox
                      checked={localVisibilitySettings.showMonthProgress}
                      onChange={() => handleVisibilityChange('showMonthProgress')}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ width: 32, height: 32, backgroundColor: theme.palette.warning.main, borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ListIcon sx={{ color: theme.palette.warning.contrastText }} />
                      </Box>
                      <Box>
                        <Typography variant="subtitle1">Список дел</Typography>
                        <Typography variant="body2" color="text.secondary">Карточка со списком задач</Typography>
                      </Box>
                    </Box>
                    <MuiCheckbox
                      checked={localVisibilitySettings.showTodoList}
                      onChange={() => handleVisibilityChange('showTodoList')}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </Drawer>

      {/* Clear User Data Dialog */}
      <Dialog
        open={openClearDialog}
        onClose={handleCloseClearDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Очистить пользовательские данные
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Вы уверены, что хотите удалить все пользовательские данные? Это действие нельзя будет отменить.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseClearDialog} color="primary">
            Отмена
          </Button>
          <Button onClick={handleClearUserData} color="error" autoFocus>
            Удалить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Vacation Dialog - Fixed syntax */}
               <VacationDialog
          open={openVacationDialog}
          onClose={() => setOpenVacationDialog(false)}
          onSave={(startDate, days) => {
            if (onVacationSave) {
              onVacationSave({ startDate, days })
            }
          }}
          onDelete={(index) => {
            if (onVacationDelete) {
              onVacationDelete(index)
            }
          }}
          onToggleVacation={(index, isVisible) => {
            if (onToggleVacation) {
              onToggleVacation(index, isVisible)
            }
          }}
          vacations={vacations}
          showWorkShiftsDuringVacation={showWorkShiftsDuringVacation}
          onShowWorkShiftsDuringVacationChange={onShowWorkShiftsDuringVacationChange}
        />


    </ThemeProvider>
  )
}
