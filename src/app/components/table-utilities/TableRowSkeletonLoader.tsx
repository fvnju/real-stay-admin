import { Skeleton, TableCell, TableRow } from "@mui/material";
import { FC } from "react";

export const TableRowSkeletonLoader: FC<{
  noOfColumns: number;
  noOfRows?: number;
}> = ({ noOfColumns, noOfRows = 10 }) => {
  return [...Array(noOfRows)].map((it, i) => (
    <TableRow key={i}>
      {[...Array(noOfColumns)].map((col, i) => (
        <TableCell variant="body" key={i}>
          <Skeleton variant="text" sx={{ fontSize: "1rem" }} />
        </TableCell>
      ))}
    </TableRow>
  ));
};
