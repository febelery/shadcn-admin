import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";
import { ButtonProps, buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PaginationProps = Omit<React.ComponentProps<"nav">, "onChange"> & {
  page?: number;
  total?: number;
  pageSize?: number;
  onChange?: (page: number) => void;
  className?: string;
};

const Pagination = ({
  page = 1,
  total = 0,
  pageSize = 10,
  onChange,
  className,
  ...props
}: PaginationProps) => {
  const totalPages = Math.ceil(total / pageSize);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (page <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("ellipsis");
        pages.push(totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = page - 1; i <= page + 1; i++) pages.push(i);
        pages.push("ellipsis");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-8">
      <nav
        role="navigation"
        aria-label="pagination"
        className={cn("flex justify-center items-center", className)}
        {...props}
      >
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => onChange?.(page - 1)}
              disabled={page <= 1}
            />
          </PaginationItem>

          {getPageNumbers().map((pageNum, index) => (
            <PaginationItem key={index}>
              {pageNum === "ellipsis" ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  isActive={page === pageNum}
                  onClick={() => onChange?.(pageNum as number)}
                >
                  {pageNum}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext
              onClick={() => onChange?.(page + 1)}
              disabled={page >= totalPages}
            />
          </PaginationItem>
        </PaginationContent>
      </nav>
      <div className="text-sm text-foreground">共 {total} 条</div>
    </div>
  );
};
Pagination.displayName = "Pagination";

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex flex-row items-center gap-1.5", className)}
    {...props}
  />
));
PaginationContent.displayName = "PaginationContent";

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
));
PaginationItem.displayName = "PaginationItem";

type PaginationLinkProps = {
  isActive?: boolean;
  disabled?: boolean;
} & Pick<ButtonProps, "size"> &
  React.ComponentProps<"button">;

const PaginationLink = ({
  className,
  isActive,
  disabled,
  size = "icon",
  ...props
}: PaginationLinkProps) => (
  <button
    aria-current={isActive ? "page" : undefined}
    disabled={disabled}
    className={cn(
      buttonVariants({
        variant: isActive ? "outline" : "ghost",
        size,
      }),
      "min-w-9 h-9 rounded-md cursor-pointer select-none",
      isActive &&
        "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
      disabled && "pointer-events-none opacity-50",
      className
    )}
    {...props}
  />
);
PaginationLink.displayName = "PaginationLink";

const PaginationPrevious = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="前往上一页"
    size="default"
    className={cn("gap-1 pl-2.5 pr-3.5", className)}
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
    <span>上一页</span>
  </PaginationLink>
);
PaginationPrevious.displayName = "PaginationPrevious";

const PaginationNext = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="前往下一页"
    size="default"
    className={cn("gap-1 pl-3.5 pr-2.5", className)}
    {...props}
  >
    <span>下一页</span>
    <ChevronRight className="h-4 w-4" />
  </PaginationLink>
);
PaginationNext.displayName = "PaginationNext";

const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    aria-hidden
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">更多页码</span>
  </span>
);
PaginationEllipsis.displayName = "PaginationEllipsis";

type PaginationSizeProps = {
  value?: number;
  onValueChange?: (value: number) => void;
  sizes?: number[];
  className?: string;
};

const PaginationSize = ({
  value = 10,
  onValueChange,
  sizes = [10, 20, 30, 50],
  className,
}: PaginationSizeProps) => (
  <Select
    value={value.toString()}
    onValueChange={(val) => onValueChange?.(Number(val))}
  >
    <SelectTrigger
      className={cn("h-9 w-[120px] border-muted-foreground/20", className)}
    >
      <SelectValue placeholder={`${value} 条/页`} />
    </SelectTrigger>
    <SelectContent>
      {sizes.map((size) => (
        <SelectItem
          key={size}
          value={size.toString()}
          className="cursor-pointer hover:bg-muted"
        >
          {size} 条/页
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);
PaginationSize.displayName = "PaginationSize";

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationSize,
};
