import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ApiError } from "@/shared/lib";

import { ActionConfirmDialog } from "./action-confirm-dialog";

describe("ActionConfirmDialog", () => {
  it("does not run the action until the user confirms", async () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn().mockResolvedValue(undefined);

    render(
      <ActionConfirmDialog
        confirmLabel="Delete item"
        description="Delete this item?"
        onClose={onClose}
        onConfirm={onConfirm}
        title="Delete item?"
      />,
    );

    expect(onConfirm).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Delete item" }));

    await waitFor(() => expect(onConfirm).toHaveBeenCalledOnce());
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("closes without running the action when canceled", () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    render(
      <ActionConfirmDialog
        confirmLabel="Delete item"
        description="Delete this item?"
        onClose={onClose}
        onConfirm={onConfirm}
        title="Delete item?"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onClose).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("keeps the dialog open and displays API errors", async () => {
    const onClose = vi.fn();
    const onConfirm = vi
      .fn()
      .mockRejectedValue(new ApiError("The item can no longer be deleted.", 409));

    render(
      <ActionConfirmDialog
        confirmLabel="Delete item"
        description="Delete this item?"
        onClose={onClose}
        onConfirm={onConfirm}
        title="Delete item?"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete item" }));

    expect(
      await screen.findByText("The item can no longer be deleted."),
    ).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("cannot be dismissed while the action is pending", async () => {
    let resolveAction: (() => void) | undefined;
    const onClose = vi.fn();
    const onConfirm = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveAction = resolve;
        }),
    );

    render(
      <ActionConfirmDialog
        confirmLabel="Delete item"
        description="Delete this item?"
        onClose={onClose}
        onConfirm={onConfirm}
        pendingLabel="Deleting..."
        title="Delete item?"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete item" }));
    const cancelButton = await screen.findByRole("button", { name: "Cancel" });
    expect(cancelButton).toBeDisabled();
    expect(screen.getByRole("button", { name: "Deleting..." })).toBeDisabled();

    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.click(cancelButton);
    expect(onClose).not.toHaveBeenCalled();

    resolveAction?.();
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
  });
});
