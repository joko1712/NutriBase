"use client";

import * as React from "react";
import {
    Box,
    Container,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    CircularProgress,
    Chip,
    Stack,
    Divider,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const NUTRISCORE_COLORS = {
    a: "#038141",
    b: "#85BB2F",
    c: "#FECB02",
    d: "#EE8100",
    e: "#E63E11",
};

const DETAIL_FIELDS = [
    "code",
    "product_name",
    "brands",
    "image_front_url",
    "image_front_small_url",
    "nutriscore_grade",
    "nutriments",
    "ingredients_text_pt",
    "ingredients_text",
    "allergens_tags",
    "categories_tags_pt",
    "categories",
    "quantity",
    "serving_size",
    "nova_group",
].join(",");

const NUTRIENT_ROWS = [
    { label: "Energia", key100: "energy-kcal_100g", keyServ: "energy-kcal_serving", unit: "kcal" },
    { label: "Lípidos", key100: "fat_100g", keyServ: "fat_serving", unit: "g", bold: true },
    { label: "  dos quais saturados", key100: "saturated-fat_100g", keyServ: "saturated-fat_serving", unit: "g" },
    { label: "  dos quais monoinsaturados", key100: "monounsaturated-fat_100g", keyServ: "monounsaturated-fat_serving", unit: "g" },
    { label: "  dos quais polinsaturados", key100: "polyunsaturated-fat_100g", keyServ: "polyunsaturated-fat_serving", unit: "g" },
    { label: "Hidratos de carbono", key100: "carbohydrates_100g", keyServ: "carbohydrates_serving", unit: "g", bold: true },
    { label: "  dos quais açúcares", key100: "sugars_100g", keyServ: "sugars_serving", unit: "g" },
    { label: "Fibra alimentar", key100: "fiber_100g", keyServ: "fiber_serving", unit: "g", bold: true },
    { label: "Proteínas", key100: "proteins_100g", keyServ: "proteins_serving", unit: "g", bold: true },
    { label: "Sal", key100: "salt_100g", keyServ: "salt_serving", unit: "g", bold: true },
    { label: "Sódio", key100: "sodium_100g", keyServ: "sodium_serving", unit: "g" },
    { label: "Cálcio", key100: "calcium_100g", keyServ: "calcium_serving", unit: "mg", multiply: 1000 },
    { label: "Ferro", key100: "iron_100g", keyServ: "iron_serving", unit: "mg", multiply: 1000 },
    { label: "Vitamina C", key100: "vitamin-c_100g", keyServ: "vitamin-c_serving", unit: "mg", multiply: 1000 },
];

export default function ProductDetail({ barcode, onBack }) {
    const [product, setProduct] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
        let cancelled = false;
        async function fetchProduct() {
            setLoading(true);
            setError(null);
            try {
                const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=${DETAIL_FIELDS}`;
                const res = await fetch(url);
                const data = await res.json();
                if (!cancelled) {
                    if (data.status === 1 && data.product) {
                        setProduct(data.product);
                    } else {
                        setError("Produto não encontrado.");
                    }
                }
            } catch (err) {
                if (!cancelled) setError("Erro ao carregar produto.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        fetchProduct();
        return () => { cancelled = true; };
    }, [barcode]);

    const fmt = (val, multiply) => {
        if (val === undefined || val === null || val === "") return "—";
        const num = typeof val === "number" ? val : parseFloat(val);
        if (isNaN(num)) return "—";
        const result = multiply ? num * multiply : num;
        return result.toFixed(1);
    };

    const ingredients = product?.ingredients_text_pt || product?.ingredients_text || "";

    const allergens = (product?.allergens_tags || [])
        .map((a) => a.replace("en:", "").replace(/-/g, " "))
        .map((a) => a.charAt(0).toUpperCase() + a.slice(1));

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "#EFEFEF" }}>
            {/* Top bar */}
            <Box
                className="navbarTop"
                sx={{
                    color: "white",
                    px: 3,
                    py: 1.5,
                    display: "flex",
                    alignItems: "center",
                }}
            >
                <IconButton size="small" sx={{ color: "white", mr: 1 }} onClick={onBack}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    NutriBase — Detalhe do Produto
                </Typography>
            </Box>

            <Container maxWidth="md" sx={{ py: 4 }}>
                {loading && (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                        <CircularProgress sx={{ color: "#764248" }} />
                    </Box>
                )}

                {error && (
                    <Paper sx={{ p: 4, textAlign: "center" }}>
                        <Typography color="error">{error}</Typography>
                    </Paper>
                )}

                {!loading && product && (
                    <>
                        {/* Product header */}
                        <Paper sx={{ p: 3, mb: 3 }}>
                            <Stack direction="row" spacing={3} alignItems="flex-start">
                                {product.image_front_url ? (
                                    <Box
                                        component="img"
                                        src={product.image_front_url}
                                        alt={product.product_name}
                                        sx={{ width: 150, height: 150, objectFit: "contain", borderRadius: 1, flexShrink: 0 }}
                                    />
                                ) : (
                                    <Box sx={{ width: 150, height: 150, bgcolor: "#ddd", borderRadius: 1, flexShrink: 0 }} />
                                )}
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                                        {product.product_name || "Sem nome"}
                                    </Typography>
                                    {product.brands && (
                                        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                                            {product.brands}
                                        </Typography>
                                    )}
                                    {product.quantity && (
                                        <Typography variant="body2" color="text.secondary">
                                            Quantidade: {product.quantity}
                                        </Typography>
                                    )}
                                    {product.serving_size && (
                                        <Typography variant="body2" color="text.secondary">
                                            Porção: {product.serving_size}
                                        </Typography>
                                    )}
                                    <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                                        {product.nutriscore_grade && product.nutriscore_grade !== "unknown" && (
                                            <Chip
                                                label={`Nutriscore ${product.nutriscore_grade.toUpperCase()}`}
                                                sx={{
                                                    bgcolor: NUTRISCORE_COLORS[product.nutriscore_grade] || "#999",
                                                    color: "white",
                                                    fontWeight: 700,
                                                }}
                                            />
                                        )}
                                        {product.nova_group && (
                                            <Chip
                                                label={`NOVA ${product.nova_group}`}
                                                variant="outlined"
                                                sx={{ fontWeight: 600 }}
                                            />
                                        )}
                                    </Stack>
                                </Box>
                            </Stack>
                        </Paper>

                        {/* Nutritional table */}
                        <Paper sx={{ mb: 3 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, p: 2, pb: 1 }}>
                                Informação Nutricional
                            </Typography>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: "#764248" }}>
                                            <TableCell sx={{ color: "white", fontWeight: 700 }}>Nutriente</TableCell>
                                            <TableCell sx={{ color: "white", fontWeight: 700 }} align="right">Por 100g</TableCell>
                                            <TableCell sx={{ color: "white", fontWeight: 700 }} align="right">Por porção</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {NUTRIENT_ROWS.map((row) => {
                                            const val100 = fmt(product.nutriments?.[row.key100], row.multiply);
                                            const valServ = fmt(product.nutriments?.[row.keyServ], row.multiply);
                                            if (val100 === "—" && valServ === "—") return null;
                                            return (
                                                <TableRow key={row.key100}>
                                                    <TableCell sx={{ fontWeight: row.bold ? 700 : 400, pl: row.label.startsWith("  ") ? 4 : 2 }}>
                                                        {row.label.trim()}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        {val100 !== "—" ? `${val100} ${row.unit}` : "—"}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        {valServ !== "—" ? `${valServ} ${row.unit}` : "—"}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>

                        {/* Ingredients */}
                        {ingredients && (
                            <Paper sx={{ p: 3, mb: 3 }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                                    Ingredientes
                                </Typography>
                                <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                                    {ingredients}
                                </Typography>
                            </Paper>
                        )}

                        {/* Allergens */}
                        {allergens.length > 0 && (
                            <Paper sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                                    Alergénios
                                </Typography>
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                    {allergens.map((a) => (
                                        <Chip key={a} label={a} color="error" variant="outlined" size="small" />
                                    ))}
                                </Stack>
                            </Paper>
                        )}
                    </>
                )}
            </Container>
        </Box>
    );
}
