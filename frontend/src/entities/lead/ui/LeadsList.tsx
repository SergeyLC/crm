"use client";

import { useEffect } from "react";
import { formatDate } from "@/shared/lib/formatDate";
import { LeadExt } from "@/entities/lead/types";
import { useGetLeadsQuery } from "@/entities/lead/api-tanstack";

import * as React from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useTranslation } from 'react-i18next';
import Paper from "@mui/material/Paper";

const buildColumns = (t: (k: string) => string): GridColDef[] => [
  { field: 'id', headerName: t('lead:list.id'), width: 70 },
  {
    field: 'name',
    headerName: t('lead:list.owner'),
    width: 130,
    valueGetter: (_value, row) => row.creator.name,
  },
  {
    field: 'phone',
    headerName: t('lead:list.phone'),
    width: 130,
    valueGetter: (_value, row) => row.contact?.phone,
  },
  { field: 'productInterest', headerName: t('lead:list.productInterest'), width: 130 },
  {
    field: 'createdAt',
    headerName: t('lead:list.createdAt'),
    width: 130,
    valueGetter: (value) => formatDate(value) || '',
  },
];

const paginationModel = { page: 0, pageSize: 5 };

export const LeadsList = ({ initialLeads }: { initialLeads: LeadExt[] }) => {
  const { t } = useTranslation('lead');
  const columns = React.useMemo(() => buildColumns(t), [t]);
  const { data: leads = initialLeads, isFetching } = useGetLeadsQuery();

  useEffect(() => {
    console.log("Leads uploaded:", leads);
  }, [leads]);

  // Removed unused onClick function

  // Removed unused onClick function and its reference

  return (
    <>
  {isFetching && <p>{t('lead:list.loading')}</p>}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <Paper sx={{ height: 400, width: "100%" }}>
          <DataGrid
            rows={leads}
            columns={columns}
            initialState={{ pagination: { paginationModel } }}
            pageSizeOptions={[5, 10]}
            checkboxSelection
            sx={{ border: 0 }}
          />
        </Paper>
      </div>
      {/* <ul className="space-y-4">
        {leads?.map((lead) => (
          <li key={lead.id} className="p-4 border rounded-lg shadow-sm">
            <h3 className="font-semibold">
              <button onClick={onClick.bind(null, lead.id)}>
                {lead.stage} - {lead.id}
              </button>
            </h3>
            <div className="text-sm text-gray-600">
              <p>Creator Name: {lead.creator.name}</p>
              <p>Creator Email: {lead.creator.email}</p>
              <p>Status: {lead.status}</p>
              <p>PotentialValue: {lead.potentialValue}</p>
              <p>Contact name: {lead.contact.name}</p>
              <p>Contact email: {lead.contact.email}</p>
              <p>Contact phone: {lead.contact.phone}</p>
              <ul className="mt-2">
                {lead?.notes?.map((note) => (
                  <li key={note.id} className="text-xs text-gray-500">
                    {note.content} - {formatDate(note.createdAt)}
                  </li>
                ))}
              </ul>
              <p>Created at: {formatDate(lead.createdAt)}</p>
              <p>Updated at: {formatDate(lead.updatedAt)}</p>
              <p>Assigned to: {lead.assignee?.name}</p>
              <p>Contract ID: {lead.contact.id}</p>
              <p>Product Interest: {lead.productInterest}</p>
            </div>
          </li>
        ))}
      </ul> */}
    </>
  );
};
