"use client";

import * as React from "react";
import {
    Box,
    Button,
    Container,
    TextField,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    InputAdornment,
    CircularProgress,
    Chip,
    Stack,
    Pagination,
    Tooltip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import SwapVertIcon from "@mui/icons-material/SwapVert";

const NUTRISCORE_COLORS = {
    a: "#038141",
    b: "#85BB2F",
    c: "#FECB02",
    d: "#EE8100",
    e: "#E63E11",
};

const PAGE_SIZE = 10;
const MAX_PAGES = 5;

const FIELDS = [
    "code",
    "product_name",
    "brands",
    "image_front_small_url",
    "nutriscore_grade",
    "nutriments",
    "categories_tags_pt",
].join(",");

export default function ProductSearch({ onBack, onSelectProduct }) {
    const [searchTerm, setSearchTerm] = React.useState("");
    const [results, setResults] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [totalPages, setTotalPages] = React.useState(0);
    const [page, setPage] = React.useState(1);
    const [searched, setSearched] = React.useState(false);
    const [sortKey, setSortKey] = React.useState(null); // null | string
    const [sortDir, setSortDir] = React.useState("asc"); // "asc" | "desc"
    const debounceRef = React.useRef(null);

    const fetchProducts = React.useCallback(async (query, pageNum) => {
        if (!query.trim()) return;
        setLoading(true);
        setSearched(true);
        try {
            const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&json=true&page_size=${PAGE_SIZE}&page=${pageNum}&lc=pt&cc=pt&fields=${FIELDS}`;
            const res = await fetch(url);
            const data = await res.json();
            setResults(data.products || []);
            const computed = Math.ceil((data.count || 0) / PAGE_SIZE);
            setTotalPages(computed > MAX_PAGES ? MAX_PAGES : computed);
        } catch (err) {
            console.error("Error fetching products:", err);
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleSearch = () => {
        if (!searchTerm.trim()) return;
        setPage(1);
        fetchProducts(searchTerm, 1);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") handleSearch();
    };

    const handlePageChange = (_, newPage) => {
        setPage(newPage);
        fetchProducts(searchTerm, newPage);
    };

    const handleSort = (key) => {
        if (sortKey === key) {
            if (sortDir === "asc") setSortDir("desc");
            else { setSortKey(null); setSortDir("asc"); }
        } else {
            setSortKey(key);
            setSortDir("asc");
        }
    };

    const sortedResults = React.useMemo(() => {
        if (!sortKey) return results;
        return [...results].sort((a, b) => {
            let valA, valB;
            if (sortKey === "nutriscore") {
                valA = a.nutriscore_grade || "z";
                valB = b.nutriscore_grade || "z";
            } else {
                valA = a?.nutriments?.[sortKey] ?? -Infinity;
                valB = b?.nutriments?.[sortKey] ?? -Infinity;
            }
            if (valA < valB) return sortDir === "asc" ? -1 : 1;
            if (valA > valB) return sortDir === "asc" ? 1 : -1;
            return 0;
        });
    }, [results, sortKey, sortDir]);

    const SortIcon = ({ colKey }) => {
        if (sortKey !== colKey) return <SwapVertIcon sx={{ fontSize: 14, ml: 0.5, opacity: 0.5 }} />;
        return sortDir === "asc"
            ? <ArrowUpwardIcon sx={{ fontSize: 14, ml: 0.5 }} />
            : <ArrowDownwardIcon sx={{ fontSize: 14, ml: 0.5 }} />;
    };

    const getNutrimentValue = (product, key) => {
        const val = product?.nutriments?.[key];
        if (val === undefined || val === null || val === "") return "—";
        return typeof val === "number" ? val.toFixed(1) : val;
    };

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
                    justifyContent: "space-between",
                }}
            >
                <Stack direction="row" alignItems="center" spacing={1}>
                    <IconButton size="small" sx={{ color: "white" }} onClick={onBack}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        NutriBase — Produtos
                    </Typography>
                </Stack>
            </Box>

            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
                    Pesquisa de Produtos
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Pesquise alimentos e consulte a informação nutricional
                </Typography>

                {/* Search bar */}
                <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                    <TextField
                        fullWidth
                        placeholder="Pesquisar produto (ex: leite, pão integral, arroz...)"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={handleKeyDown}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                        size="small"
                        sx={{ bgcolor: "white", borderRadius: 1 }}
                    />
                    <Button
                        variant="contained"
                        onClick={handleSearch}
                        disabled={loading || !searchTerm.trim()}
                        sx={{ backgroundColor: "#764248", minWidth: 120 }}
                    >
                        {loading ? <CircularProgress size={22} color="inherit" /> : "Pesquisar"}
                    </Button>
                </Stack>

                {/* Results */}
                {loading && (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                        <CircularProgress sx={{ color: "#764248" }} />
                    </Box>
                )}

                {!loading && searched && results.length === 0 && (
                    <Paper sx={{ p: 4, textAlign: "center" }}>
                        <Typography color="text.secondary">
                            Nenhum produto encontrado. Tente outro termo de pesquisa.
                        </Typography>
                    </Paper>
                )}

                {!loading && results.length > 0 && (
                    <>
                        <TableContainer component={Paper} sx={{ mb: 2 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: "#764248" }}>
                                        <TableCell sx={{ color: "white", fontWeight: 700 }} />
                                        <TableCell sx={{ color: "white", fontWeight: 700 }}>Produto</TableCell>
                                        <TableCell sx={{ color: "white", fontWeight: 700 }}>Marca</TableCell>
                                        <TableCell
                                            sx={{ color: "white", fontWeight: 700, cursor: "pointer", userSelect: "none" }}
                                            align="center"
                                            onClick={() => handleSort("nutriscore")}
                                        >
                                            <Stack direction="row" alignItems="center" justifyContent="center">
                                                Nutriscore<SortIcon colKey="nutriscore" />
                                            </Stack>
                                        </TableCell>
                                        <TableCell
                                            sx={{ color: "white", fontWeight: 700, cursor: "pointer", userSelect: "none" }}
                                            align="right"
                                            onClick={() => handleSort("energy-kcal_100g")}
                                        >
                                            <Stack direction="row" alignItems="center" justifyContent="flex-end">
                                                Energia (kcal)<SortIcon colKey="energy-kcal_100g" />
                                            </Stack>
                                        </TableCell>
                                        <TableCell
                                            sx={{ color: "white", fontWeight: 700, cursor: "pointer", userSelect: "none" }}
                                            align="right"
                                            onClick={() => handleSort("proteins_100g")}
                                        >
                                            <Stack direction="row" alignItems="center" justifyContent="flex-end">
                                                Proteínas (g)<SortIcon colKey="proteins_100g" />
                                            </Stack>
                                        </TableCell>
                                        <TableCell
                                            sx={{ color: "white", fontWeight: 700, cursor: "pointer", userSelect: "none" }}
                                            align="right"
                                            onClick={() => handleSort("carbohydrates_100g")}
                                        >
                                            <Stack direction="row" alignItems="center" justifyContent="flex-end">
                                                Glícidos (g)<SortIcon colKey="carbohydrates_100g" />
                                            </Stack>
                                        </TableCell>
                                        <TableCell
                                            sx={{ color: "white", fontWeight: 700, cursor: "pointer", userSelect: "none" }}
                                            align="right"
                                            onClick={() => handleSort("fat_100g")}
                                        >
                                            <Stack direction="row" alignItems="center" justifyContent="flex-end">
                                                Lípidos (g)<SortIcon colKey="fat_100g" />
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {sortedResults.map((product) => (
                                        <TableRow
                                            key={product.code}
                                            hover
                                            sx={{ cursor: "pointer", "&:hover": { bgcolor: "#f5f0f0" } }}
                                            onClick={() => onSelectProduct(product.code)}
                                        >
                                            <TableCell sx={{ width: 50, p: 1 }}>
                                                {product.image_front_small_url ? (
                                                    <Box
                                                        component="img"
                                                        src={product.image_front_small_url}
                                                        alt=""
                                                        sx={{ width: 40, height: 40, objectFit: "contain", borderRadius: 0.5 }}
                                                    />
                                                ) : (
                                                    <Box sx={{ width: 40, height: 40, bgcolor: "#ddd", borderRadius: 0.5 }} />
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    {product.product_name || "Sem nome"}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="text.secondary">
                                                    {product.brands || "—"}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                {product.nutriscore_grade && product.nutriscore_grade !== "unknown" ? (
                                                    <Chip
                                                        label={product.nutriscore_grade.toUpperCase()}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: NUTRISCORE_COLORS[product.nutriscore_grade] || "#999",
                                                            color: "white",
                                                            fontWeight: 700,
                                                            minWidth: 32,
                                                        }}
                                                    />
                                                ) : (
                                                    "—"
                                                )}
                                            </TableCell>
                                            <TableCell align="right">{getNutrimentValue(product, "energy-kcal_100g")}</TableCell>
                                            <TableCell align="right">{getNutrimentValue(product, "proteins_100g")}</TableCell>
                                            <TableCell align="right">{getNutrimentValue(product, "carbohydrates_100g")}</TableCell>
                                            <TableCell align="right">{getNutrimentValue(product, "fat_100g")}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {totalPages > 1 && (
                            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                                <Pagination
                                    count={totalPages > 100 ? 100 : totalPages}
                                    page={page}
                                    onChange={handlePageChange}
                                    sx={{
                                        "& .Mui-selected": { bgcolor: "#764248 !important", color: "white" },
                                    }}
                                />
                            </Box>
                        )}
                    </>
                )}
            </Container>
        </Box>
    );
}
