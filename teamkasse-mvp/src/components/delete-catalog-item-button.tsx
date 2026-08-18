"use client";

import { Trash2 } from "lucide-react";
import { deleteCatalogItemAction } from "@/app/actions";

export function DeleteCatalogItemButton({
  itemId,
  itemName,
  disabled = false
}: {
  itemId: string;
  itemName: string;
  disabled?: boolean;
}) {
  return (
    <form
      action={deleteCatalogItemAction}
      className="inline-action"
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `\"${itemName}\" wirklich aus dem Katalog loeschen? Bereits vorhandene Buchungen bleiben in der Historie.`
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="item_id" value={itemId} />
      <input type="hidden" name="confirm_delete" value="delete-catalog-item" />
      <button
        className="icon-button catalog-order-button catalog-delete-button"
        type="submit"
        title={`${itemName} loeschen`}
        aria-label={`${itemName} loeschen`}
        disabled={disabled}
      >
        <Trash2 size={15} />
      </button>
    </form>
  );
}
