import * as React from "react";
import { Box, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography } from "@mui/material";

export function FactorPicker({ title, options, selectedId, value, onChange }) {
    const selected = options.find((o) => o.id === selectedId) || null;
    const isRange = selected?.kind === "range";

    const handleSelect = (e) => {
        const id = e.target.value;
        const opt = options.find((o) => o.id === id);
        if (!opt) return;

        if (opt.kind === "fixed") onChange({ selectedId: id, value: opt.value });
        else onChange({ selectedId: id, value: opt.min });
    };

    const raw = value ?? "";
    const num = raw === "" || raw === "-" || String(raw).endsWith(".") ? NaN : Number(raw);
    const isNum = Number.isFinite(num);

    const outOfRange =
        isRange && isNum && (num < selected.min || num > selected.max);

    const handleTypedFactor = (e) => {
        onChange({ selectedId, value: e.target.value });
    };

    return (
        <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                {title}
            </Typography>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2} style={{ width: 550 }}>
                <Stack sx={{ flex: 1 }} spacing={2}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Estado</InputLabel>
                        <Select label="Estado" value={selectedId || ""} onChange={handleSelect}>
                            {options.map((o) => (
                                <MenuItem key={o.id} value={o.id}>
                                    {o.label}
                                    {o.kind === "fixed"
                                        ? ` — ${o.value}`
                                        : o.min === o.max
                                            ? ` — ${o.min}`
                                            : ` — ${o.min} a ${o.max}`}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>


                </Stack>

                <Stack sx={{ flex: 1 }} spacing={2}>
                    <TextField
                        size="small"
                        label="Factor (selecionado)"
                        value={raw}
                        onChange={handleTypedFactor}
                        error={outOfRange}
                        helperText={
                            isRange && selected.min !== selected.max

                        }
                        inputProps={isRange ? { inputMode: "decimal" } : undefined}
                    />
                </Stack>
            </Stack>
        </Box>
    );
}