import { useState } from "react"
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Typography, Alert, IconButton, Switch, FormControlLabel } from "@mui/material"
import { DatePicker } from "@mui/x-date-pickers/DatePicker"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"
import { ru } from "date-fns/locale"
import { Delete as DeleteIcon, Close as CloseIcon, Edit as EditIcon } from "@mui/icons-material"

interface VacationDialogProps {
  open: boolean
  onClose: () => void
  onSave: (startDate: Date, days: number, name: string) => void
  onDelete: (index: number) => void
  onEdit?: (index: number, startDate: Date, days: number, name: string) => void
  onToggleVacation?: (index: number, isVisible: boolean) => void
  vacations: Array<{ startDate: Date, days: number, name?: string, isVisible?: boolean }>
  showWorkShiftsDuringVacation?: boolean
  onShowWorkShiftsDuringVacationChange?: (value: boolean) => void
}

export default function VacationDialog({
  open,
  onClose,
  onSave,
  onDelete,
  onEdit,
  onToggleVacation,
  vacations = [],
  showWorkShiftsDuringVacation = false,
  onShowWorkShiftsDuringVacationChange,
}: VacationDialogProps) {
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [days, setDays] = useState<string>("")
  const [name, setName] = useState<string>("")
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSave = () => {
    const hasStartDate = startDate != null
    const hasDays = days !== "" && !isNaN(Number(days)) && Number(days) > 0
    const isAddingNewVacation = hasStartDate || hasDays

    // Пустая форма — только закрыть (например, после переключения тумблеров)
    if (!isAddingNewVacation) {
      setError(null)
      onClose()
      return
    }

    if (!hasStartDate) {
      setError("Пожалуйста, выберите дату начала отпуска")
      return
    }

    if (!hasDays) {
      setError("Пожалуйста, введите корректное количество дней")
      return
    }

    if (editingIndex !== null && onEdit) {
      onEdit(editingIndex, startDate, Number(days), name.trim())
    } else {
      onSave(startDate, Number(days), name.trim())
    }
    setStartDate(null)
    setDays("")
    setName("")
    setEditingIndex(null)
    setError(null)
    onClose()
  }

  const handleClose = () => {
    setStartDate(null)
    setDays("")
    setName("")
    setEditingIndex(null)
    setError(null)
    onClose()
  }

  const handleEdit = (index: number) => {
    const vacation = vacations[index]
    if (!vacation) return
    setEditingIndex(index)
    setStartDate(new Date(vacation.startDate))
    setDays(String(vacation.days))
    setName(vacation.name || "")
    setError(null)
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Управление отпусками
          <IconButton onClick={handleClose} sx={{ p: 0.5 }} aria-label="Закрыть">
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <Box
              sx={{
                p: 1.5,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                backgroundColor: 'action.hover',
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={showWorkShiftsDuringVacation}
                    onChange={(e) => onShowWorkShiftsDuringVacationChange?.(e.target.checked)}
                    color="primary"
                  />
                }
                label="Показывать рабочие смены во время отпуска"
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', pl: 4.5 }}>
                При включении в календаре видны смена по графику и отметка отпуска; при выключении дни отпуска отображаются как выходные.
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Название отпуска"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
                inputProps={{ maxLength: 60 }}
              />
              <DatePicker
                label="Дата начала отпуска"
                value={startDate}
                onChange={(newValue: Date | null) => {
                  setStartDate(newValue)
                  setError(null)
                }}
                slotProps={{ textField: { fullWidth: true, error: !!error && !startDate } }}
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
              {error && (
                <Alert severity="error" sx={{ mt: 1, py: 0.5 }}>
                  <Typography variant="body2" color="error">
                    {error}
                  </Typography>
                </Alert>
              )}
            </Box>

            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Список отпусков:</Typography>
              {vacations.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {vacations.map((vacation, index) => (
                     <Box
                       key={index}
                       sx={{ 
                         display: 'flex',
                         justifyContent: 'space-between',
                         alignItems: 'center',
                         p: 1.5,
                         border: '1px solid',
                         borderColor: 'divider',
                         borderRadius: 1,
                         backgroundColor: 'background.paper',
                         '&:hover': {
                           backgroundColor: 'action.hover',
                         }
                       }}
                     >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                           <FormControlLabel
                              control={
                                <Switch
                                  checked={vacation.isVisible !== false}
                                  onChange={(e) => onToggleVacation?.(index, e.target.checked)}
                                  color="primary"
                                  size="small"
                                />
                              }
                              label=""
                              title="Показывать отпуск на графике"
                           />
                         <Box>
                           <Typography variant="body2" sx={{ fontWeight: 600 }}>
                             {vacation.name?.trim() || "Отпуск"}
                           </Typography>
                           <Typography variant="body2">
                             <strong>Начало:</strong> {vacation.startDate.toLocaleDateString("ru-RU")}
                           </Typography>
                           <Typography variant="body2">
                             <strong>Дней:</strong> {vacation.days}
                           </Typography>
                         </Box>
                       </Box>
                       <Box sx={{ display: 'flex', alignItems: 'center' }}>

                         <IconButton

                           color="primary"

                           size="small"

                           onClick={() => handleEdit(index)}

                           sx={{ minWidth: 'auto' }}

                           aria-label="Редактировать отпуск"

                         >

                           <EditIcon fontSize="small" />

                         </IconButton>

                         <IconButton

                           color="error"

                           size="small"

                           onClick={() => {

                             if (editingIndex === index) {

                               setEditingIndex(null)

                               setStartDate(null)

                               setDays("")

                               setError(null)

                             }

                             onDelete(index)

                           }}

                           sx={{ minWidth: 'auto' }}

                           aria-label="Удалить отпуск"

                         >

                           <DeleteIcon fontSize="small" />

                         </IconButton>

                       </Box>
                     </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2, backgroundColor: '#f9f9f9', borderRadius: 1 }}>
                  Отпусков пока нет
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="secondary">Отмена</Button>
          <Button onClick={handleSave} color="primary" variant="contained">{editingIndex !== null ? "Сохранить изменения" : "Сохранить"}</Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  )
}