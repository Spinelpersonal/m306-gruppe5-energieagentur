export function csvExport(data, filename = "export.csv") {
    if (!data || !data.length) {
        console.error("Keine Daten zum Exportieren vorhanden.");
        return;
    };

    const headers = Object.keys(data[0]);

    const csvRows = [];

    csvRows.push(headers.join(","));

    for (const row of data) {
        const values = headers.map(header => {
            const value = row[header] ?? "";
            const strValue = String(value).replace(/"/g, '""');
            return /[",\n\r]/.test(strValue)
                ? `"${strValue}"`
                : strValue;
        });
        csvRows.push(values.join(","));
    };

    const csvString = csvRows.join("\n");

    const blob = new Blob(["\uFEFF" + csvString], { type: "text/csv" });

    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
};
