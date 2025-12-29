"use client"

import { useState, useEffect } from "react"
import type { ScheduleData, GlobalSettings } from "@/lib/types"
import { Button, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, Box, Divider, TextField, Switch, Checkbox as MuiCheckbox } from "@mui/material"
import { Palette as PaletteIcon, Calculate as CalculatorIcon, Close as CloseIcon, Note as NoteIcon, Logout as LogoutIcon, Visibility as VisibilityIcon, DarkMode as DarkModeIcon, LightMode as LightModeIcon } from "@mui/icons-material"
import { ThemeProvider, createTheme } from "@mui/material/styles"

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
}

export default function BurgerMenu({
  isOpen,
  isClosing,
  scheduleData,
  onClose,
  onBackdropClick,
  onGlobalSettingsSave,
  onGlobalNotesSave,
  onVisibilitySettingsSave,
  visibilitySettings = { showShiftInfo: true, showMonthProgress: true, showTodoList: true }
}: BurgerMenuProps) {
  const [activeSection, setActiveSection] = useState<"main" | "colors" | "salary" | "visibility">("main")
  const [dayColor, setDayColor] = useState(scheduleData.globalSettings.dayShiftColor)
  const [nightColor, setNightColor] = useState(scheduleData.globalSettings.nightShiftColor)
  const [customNumber, setCustomNumber] = useState<string>(scheduleData.globalSettings.customNumber?.toString() || "")
  const [localVisibilitySettings, setLocalVisibilitySettings] = useState(visibilitySettings)
  const [darkMode, setDarkMode] = useState(false)

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
      dayShiftColor: dayColor,
      nightShiftColor: nightColor,
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

  if (!isOpen) return null

  return (
    <ThemeProvider theme={theme}>
      <Drawer
        anchor="left"
        open={isOpen}
        onClose={onClose}
        sx={{ 
          '& .MuiDrawer-paper': {
            width: 320,
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
          }
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header */}
          <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {activeSection === "main" ? (
              <Typography variant="h6">Меню</Typography>
            ) : (
              <Button
                onClick={() => setActiveSection("main")}
                startIcon={<CloseIcon />}
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
                  <ListItemButton onClick={() => setActiveSection("colors")}>
                    <ListItemIcon>
                      <PaletteIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Цвета смен" secondary="Настройка цветов" />
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
                      <NoteIcon color="warning" />
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

                {/* Theme Toggle */}
                <ListItem disablePadding>
                  <ListItemButton onClick={() => setActiveSection("visibility")}>
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

            {/* Colors Section */}
            {activeSection === "colors" && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h6">Цвета смен</Typography>

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
                    Для расчета аванса
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
                        <Box sx={{ width: 16, height: 16, backgroundColor: theme.palette.primary.main, borderRadius: '50%' }}></Box>
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
                        <Box sx={{ width: 16, height: 16, backgroundColor: theme.palette.secondary.main, borderRadius: '50%' }}></Box>
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
                        <Box sx={{ width: 16, height: 16, backgroundColor: theme.palette.warning.main, borderRadius: '2px' }}></Box>
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
    </ThemeProvider>
  )
}