import { useState } from "react"
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Typography } from "@mui/material"
import { DatePicker } from "@mui/x-date-pickers/DatePicker"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"
import { ru } from "date-fns/locale"

interface VacationDialogProps {
  open: boolean
  onClose: () => void
  onSave: (startDate: Date, days: number) => void
  onDelete: (index: number) => void
  vacations: Array<{ startDate: Date, days: number }>
}

export default function VacationDialog({ open, onClose, onSave, onDelete, vacations = [] }: VacationDialogProps) {
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [days, setDays] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [showVacations, setShowVacations] = useState<boolean>(false)

  const handleSave = () => {
    if (!startDate) {
      setError("Пожалуйста, выберите дату начала отпуска")
      return
    }

    if (!days || isNaN(Number(days)) || Number(days) <= 0) {
      setError("Пожалуйста, введите корректное количество дней")
      return
    }

    onSave(startDate, Number(days))
    setStartDate(null)
    setDays("")
    setError(null)
    onClose()
  }

  const handleClose = () => {
    setStartDate(null)
    setDays("")
    setError(null)
    onClose()
  }

  const handleToggleVacations = () => {
    setShowVacations(!showVacations)
  }

  const handleDeleteVacation = (index: number) => {
    onDelete(index)
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Добавить отпуск</DialogTitle>
        <DialogActions sx={{ justifyContent: 'flex-start', px: 3, pt: 0 }}>
          <Button onClick={handleToggleVacations} color="secondary">
            {showVacations ? 'Скрыть отпуска' : 'Показать отпуска'}
          </Button>
        </DialogActions>
        <DialogContent>
          {showVacations ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              {vacations.length > 0 ? (
                vacations.map((vacation, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1,
                      p: 1,
                      border: '1px solid #ccc',
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="body1">
                      <strong>Начало:</strong> {vacation.startDate.toLocaleDateString("ru-RU")}
                    </Typography>

                    <Typography variant="body1">
                      <strong>Дней:</strong> {vacation.days}
                    </Typography>

                    <Button
                      color="error"
                      size="small"
                      onClick={() => handleDeleteVacation(index)}
                    >
                      Удалить
                    </Button>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  Отпусков пока нет
                </Typography>
              )}
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <DatePicker
                label="Дата начала отпуска"
                value={startDate}
                onChange={(newValue: Date | null) => {
                  setStartDate(newValue)
                  setError(null)
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!error && !startDate
                  }
                }}
              />
              <TextField
                label="Количество дней"
                type="number"
                value={days}
                onChange={(e) => {
                  setDays(e.target.value)
                  setError(null)
                }}
                fullWidth
                inputProps={{ min: 1 }}
                error={!!error && (!days || isNaN(Number(days)) || Number(days) <= 0)}
                helperText={error && (!days || isNaN(Number(days)) || Number(days) <= 0) ? error : undefined}
              />
              {error && (!days || isNaN(Number(days)) || Number(days) <= 0) && (
                <Typography color="error" variant="body2">
                  {error}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="secondary">
            Отмена
          </Button>
          {!showVacations && (
            <Button onClick={handleSave} color="primary" variant="contained">
              Сохранить
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  )
}