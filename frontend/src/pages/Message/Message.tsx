import { FormEvent, useMemo, useState } from "react";
import {
  LuActivity,
  LuCircleAlert,
  LuCircleX,
  LuFileSpreadsheet,
  LuPrinter,
  LuInfo,
  LuSearch,
  LuShieldAlert,
  LuSlidersHorizontal,
  LuX,
} from "react-icons/lu";
import {
  ExportMessagesResponse,
  MessageQuery,
  MessageRow,
  useGetDevicesQuery,
  useGetFilteredMessagesQuery,
  useGetSeverityStatsQuery,
} from "@/common/services/FilterMessages/FilterMessages";
import { createMessagesXlsx } from "@/common/utils/xlsx";
import "./Message.scss";
import { formatServerDateTime, serverLocalDateTimeToIso, useServerTimeZone } from "@/common/timezone/ServerTimeZoneContext";

const severityOptions = [
  { value: "0", label: "Emergency" },
  { value: "1", label: "Alert" },
  { value: "2", label: "Critical" },
  { value: "3", label: "Error" },
  { value: "4", label: "Warning" },
  { value: "5", label: "Notice" },
  { value: "6", label: "Informational" },
  { value: "7", label: "Debug" },
];

const cardConfig = [
  { severities: [6, 5], label: "Informational/Notice", icon: LuInfo, className: "info" },
  { severities: [3], label: "Error", icon: LuCircleX, className: "error" },
  { severities: [4], label: "Warning", icon: LuCircleAlert, className: "warning" },
  { severities: [2], label: "Critical", icon: LuShieldAlert, className: "critical" },
  { severities: [1], label: "Alert", icon: LuCircleAlert, className: "alert" },
  { severities: [0], label: "Emergency", icon: LuShieldAlert, className: "emergency" },
];


const buildFilterParams = (filters: MessageQuery) => {
  const params = new URLSearchParams();
  if (filters.deviceId) params.append("deviceId", filters.deviceId);
  if (filters.type !== undefined && filters.type !== "") params.append("type", filters.type);
  if (filters.fromTime) params.append("from", filters.fromTime);
  if (filters.toTime) params.append("to", filters.toTime);
  if (filters.search?.trim()) params.append("search", filters.search.trim());
  return params;
};

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

const exportFilename = (extension: string) => {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `syslog-messages-${stamp}.${extension}`;
};

type PaginationItem = number | "ellipsis-left" | "ellipsis-right";

const getPaginationItems = (total: number, current: number): PaginationItem[] => {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  if (current <= 3) return [1, 2, 3, "ellipsis-right", total];
  if (current >= total - 2) return [1, "ellipsis-left", total - 2, total - 1, total];
  return [1, "ellipsis-left", current - 1, current, current + 1, "ellipsis-right", total];
};

const MessagesPage = () => {
  const serverTimeZone = useServerTimeZone();
  const formatDate = (value: string) => formatServerDateTime(value, serverTimeZone);
  const toIso = (value: string) => serverLocalDateTimeToIso(value, serverTimeZone);
  const { data: devices = [], isLoading: devicesLoading } = useGetDevicesQuery();
  const { data: severityStats = [] } = useGetSeverityStatsQuery(undefined, {
    pollingInterval: 15000,
  });

  const [draftDevice, setDraftDevice] = useState("");
  const [draftType, setDraftType] = useState("");
  const [draftFrom, setDraftFrom] = useState("");
  const [draftTo, setDraftTo] = useState("");

  const [filters, setFilters] = useState<MessageQuery>({});
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [exporting, setExporting] = useState<"excel" | "print" | null>(null);

  const isFiltered = Boolean(
    filters.deviceId ||
      filters.type !== undefined ||
      filters.fromTime ||
      filters.toTime ||
      filters.search,
  );

  const query = useMemo<MessageQuery>(
    () => ({
      ...filters,
      page,
      limit: isFiltered ? limit : 10,
    }),
    [filters, page, limit, isFiltered],
  );

  const { data, isLoading, isError } = useGetFilteredMessagesQuery(query, {
    pollingInterval: isFiltered ? 0 : 10000,
  });

  const messages = data?.items ?? [];
  const pagination = data?.pagination ?? { page: 1, limit: 10, total: 0, totalPages: 1 };

  const statCount = (severities: number[]) =>
    severities.reduce(
      (total, severity) =>
        total + (severityStats.find((item) => item.severity === severity)?.count ?? 0),
      0,
    );

  const applyFilters = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    setFilters((current) => ({
      ...current,
      deviceId: draftDevice || undefined,
      type: draftType || undefined,
      fromTime: toIso(draftFrom),
      toTime: toIso(draftTo),
    }));
  };

  const applySeverityCard = (severities: number[]) => {
    const now = new Date();
    const from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const typeFilter = severities.join(",");
    setDraftType(severities.length === 1 ? String(severities[0]) : "");
    setDraftFrom("");
    setDraftTo("");
    setPage(1);
    setLimit(10);
    setFilters({
      type: typeFilter,
      fromTime: from.toISOString(),
      toTime: now.toISOString(),
    });
  };

  const applySearch = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    setFilters((current) => ({ ...current, search: searchInput.trim() || undefined }));
  };

  const resetAll = () => {
    setDraftDevice("");
    setDraftType("");
    setDraftFrom("");
    setDraftTo("");
    setSearchInput("");
    setLimit(10);
    setPage(1);
    setFilters({});
  };

  const setQuickDevice = (value: string) => {
    setDraftDevice(value);
    setPage(1);
    setFilters((current) => ({ ...current, deviceId: value || undefined }));
  };

  const setQuickType = (value: string) => {
    setDraftType(value);
    setPage(1);
    setFilters((current) => ({ ...current, type: value || undefined }));
  };

  const paginationItems = useMemo(
    () => getPaginationItems(pagination.totalPages, pagination.page),
    [pagination.page, pagination.totalPages],
  );

  const getExportRows = async (): Promise<{ items: MessageRow[]; truncated: boolean; maxRows?: number }> => {
    if (!isFiltered) return { items: messages, truncated: false };

    const params = buildFilterParams(filters);
    const response = await fetch(`/api/messages-filter/export?${params.toString()}`, {
      credentials: "include",
    });
    const body = (await response.json().catch(() => ({}))) as ExportMessagesResponse & { message?: string };
    if (!response.ok) throw new Error(body.message || "Unable to export messages");
    return body;
  };

  const exportExcel = async () => {
    try {
      setExporting("excel");
      const result = await getExportRows();
      const workbook = createMessagesXlsx(
        result.items.map((message) => ({
          dateTime: formatDate(message.time),
          device: message.deviceId || "Unknown",
          severity: message.severityLabel,
          message: message.message,
        })),
      );
      downloadBlob(workbook, exportFilename("xlsx"));
      if (result.truncated) window.alert(`Export is limited to the first ${result.maxRows?.toLocaleString()} matching messages.`);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to export messages");
    } finally {
      setExporting(null);
    }
  };

  const printMessages = async () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      window.alert("Allow pop-ups to open the printable report.");
      return;
    }
    printWindow.document.write("<!doctype html><html><body style=\"font-family:Arial,sans-serif;padding:24px;color:#475569\">Preparing printable report...</body></html>");
    printWindow.document.close();

    try {
      setExporting("print");
      const result = await getExportRows();

      const rows = result.items.map((message) => `
        <tr>
          <td>${escapeHtml(formatDate(message.time))}</td>
          <td>${escapeHtml(message.deviceId || "Unknown")}</td>
          <td>${escapeHtml(message.severityLabel)}</td>
          <td class="message">${escapeHtml(message.message)}</td>
        </tr>`).join("");

      printWindow.document.open();
      printWindow.document.write(`<!doctype html>
<html><head><meta charset="utf-8"><title>Syslog Messages - Print</title>
<style>
@page{size:A4 landscape;margin:12mm}
*{box-sizing:border-box}
body{font-family:Arial,sans-serif;color:#172033;margin:0;background:#fff}
h1{font-size:20px;margin:0 0 4px}
.meta{color:#64748b;font-size:11px;margin-bottom:16px}
table{width:100%;border-collapse:collapse;font-size:9px;table-layout:fixed}
thead{display:table-header-group}
th{background:#f1f5f9;text-align:left;padding:7px;border:1px solid #cfd8e3}
td{padding:6px 7px;border:1px solid #dbe3ec;vertical-align:top}
th:nth-child(1),td:nth-child(1){width:17%}
th:nth-child(2),td:nth-child(2){width:16%}
th:nth-child(3),td:nth-child(3){width:12%}
th:nth-child(4),td:nth-child(4){width:55%}
.message{word-break:break-word;white-space:normal}
tr{break-inside:avoid}
footer{margin-top:10px;color:#64748b;font-size:9px}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>
<h1>Syslog Messages</h1>
<div class="meta">Generated ${escapeHtml(formatServerDateTime(new Date(), serverTimeZone))} · ${result.items.length.toLocaleString()} messages</div>
<table><thead><tr><th>Date &amp; time</th><th>Device</th><th>Severity</th><th>Message</th></tr></thead><tbody>${rows}</tbody></table>
${result.truncated ? `<footer>Export limited to the first ${result.maxRows?.toLocaleString()} matching messages.</footer>` : ""}
<script>window.onload=()=>{window.focus();window.print();};<\/script></body></html>`);
      printWindow.document.close();
    } catch (error) {
      printWindow.close();
      window.alert(error instanceof Error ? error.message : "Unable to export messages");
    } finally {
      setExporting(null);
    }
  };

  return (
    <section className="messages-page">
      {!isFiltered && (
        <div className="severity-cards">
          {cardConfig.map(({ severities, label, icon: Icon, className }) => (
            <button
              key={className}
              type="button"
              className={`severity-card severity-card--${className}`}
              onClick={() => applySeverityCard(severities)}
              title={`Show ${label.toLowerCase()} messages from the last 24 hours`}
            >
              <div className="severity-card__icon"><Icon size={22} /></div>
              <div>
                <span className="severity-card__label">{label}</span>
                <strong>{statCount(severities).toLocaleString()}</strong>
                <small>Last 24 hours</small>
              </div>
            </button>
          ))}
        </div>
      )}

      <form className="messages-filter" onSubmit={applyFilters}>
        <div className="messages-filter__heading">
          <div className="messages-filter__title">
            <LuSlidersHorizontal size={18} />
            <div>
              <strong>Message filters</strong>
              <span>Limit results by source, severity and time range</span>
            </div>
          </div>
          {isFiltered && (
            <button type="button" className="messages-filter__clear" onClick={resetAll}>
              <LuX size={16} /> Clear filters
            </button>
          )}
        </div>

        <div className="messages-filter__grid">
          <label>
            <span>Device</span>
            <select
              value={draftDevice}
              onChange={(event) => setDraftDevice(event.target.value)}
              disabled={devicesLoading}
            >
              <option value="">All devices</option>
              {devices.map((device) => (
                <option key={device.id} value={device.id}>{device.name}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Severity</span>
            <select value={draftType} onChange={(event) => setDraftType(event.target.value)}>
              <option value="">All severities</option>
              {severityOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <label>
            <span>From</span>
            <input type="datetime-local" value={draftFrom} onChange={(e) => setDraftFrom(e.target.value)} />
          </label>

          <label>
            <span>To</span>
            <input type="datetime-local" value={draftTo} onChange={(e) => setDraftTo(e.target.value)} />
          </label>

          <button type="submit" className="messages-filter__search-button">
            <LuSearch size={18} /> Search
          </button>
        </div>
      </form>

      <div className="messages-table-card">
        <div className="messages-table-card__header">
          <div>
            <span className="messages-table-card__eyebrow">Event log</span>
            <h2>{isFiltered ? "Filtered results" : "Latest 10 messages"}</h2>
            <p>
              {isFiltered
                ? `${pagination.total.toLocaleString()} matching messages`
                : "Automatically refreshed from the collector"}
            </p>
          </div>
          <div className="messages-table-card__controls">
            <div className="messages-export-actions" aria-label="Export messages">
              <button
                type="button"
                className="messages-export-button messages-export-button--excel"
                onClick={() => void exportExcel()}
                disabled={Boolean(exporting) || messages.length === 0}
                title="Export the current results for Microsoft Excel"
              >
                <LuFileSpreadsheet size={17} /> {exporting === "excel" ? "Exporting..." : "Excel"}
              </button>
              <button
                type="button"
                className="messages-export-button"
                onClick={() => void printMessages()}
                disabled={Boolean(exporting) || messages.length === 0}
                title="Open printable table"
              >
                <LuPrinter size={17} /> {exporting === "print" ? "Preparing..." : "Print"}
              </button>
            </div>

            <form className="message-search" onSubmit={applySearch}>
              <LuSearch size={17} />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search message text..."
              />
              {searchInput && (
                <button
                  type="button"
                  aria-label="Clear message search"
                  onClick={() => {
                    setSearchInput("");
                    setPage(1);
                    setFilters((current) => ({ ...current, search: undefined }));
                  }}
                >
                  <LuX size={15} />
                </button>
              )}
            </form>

            <select
              className="table-quick-filter"
              value={filters.deviceId ?? ""}
              onChange={(event) => setQuickDevice(event.target.value)}
              aria-label="Filter table by device"
            >
              <option value="">All devices</option>
              {devices.map((device) => (
                <option key={device.id} value={device.id}>{device.name}</option>
              ))}
            </select>

            <select
              className="table-quick-filter"
              value={filters.type ?? ""}
              onChange={(event) => setQuickType(event.target.value)}
              aria-label="Filter table by severity"
            >
              <option value="">All severities</option>
              {severityOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="messages-table-wrap">
          <table className="messages-table">
            <thead>
              <tr>
                <th>Date & time</th>
                <th>Device</th>
                <th>Severity</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && !data ? (
                <tr><td colSpan={4} className="messages-table__state"><LuActivity className="spin" /> Loading messages...</td></tr>
              ) : isError && !data ? (
                <tr><td colSpan={4} className="messages-table__state messages-table__state--error">Unable to load messages.</td></tr>
              ) : messages.length === 0 ? (
                <tr><td colSpan={4} className="messages-table__state">No messages match the selected filters.</td></tr>
              ) : (
                messages.map((message) => (
                  <tr key={message.id}>
                    <td className="messages-table__time">{formatDate(message.time)}</td>
                    <td><span className="device-pill">{message.deviceId || "Unknown"}</span></td>
                    <td>
                      <span className={`severity-badge severity-badge--${message.severity}`}>
                        <i /> {message.severityLabel}
                      </span>
                    </td>
                    <td className="messages-table__message" title={message.message}>{message.message}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {isFiltered && (
          <div className="messages-table-card__footer">
            <div className="page-size">
              <span>Rows per page</span>
              <select
                value={limit}
                onChange={(event) => {
                  setLimit(Number(event.target.value));
                  setPage(1);
                }}
              >
                {[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
              </select>
            </div>

            <div className="pagination-summary">
              {pagination.total > 0
                ? `${(pagination.page - 1) * pagination.limit + 1}–${Math.min(
                    pagination.page * pagination.limit,
                    pagination.total,
                  )} of ${pagination.total.toLocaleString()}`
                : "0 results"}
            </div>

            <nav className="pagination" aria-label="Messages pagination">
              <button disabled={pagination.page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</button>
              {paginationItems.map((item, index) =>
                typeof item === "number" ? (
                  <button
                    key={item}
                    className={item === pagination.page ? "active" : ""}
                    onClick={() => setPage(item)}
                    aria-current={item === pagination.page ? "page" : undefined}
                  >
                    {item}
                  </button>
                ) : (
                  <span key={`${item}-${index}`} className="pagination__ellipsis" aria-hidden="true">…</span>
                ),
              )}
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              >
                Next
              </button>
            </nav>
          </div>
        )}
      </div>
    </section>
  );
};

export default MessagesPage;
