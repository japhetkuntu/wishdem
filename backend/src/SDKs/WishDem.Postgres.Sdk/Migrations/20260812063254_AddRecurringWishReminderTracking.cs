using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WishDem.Postgres.Sdk.Migrations
{
    /// <inheritdoc />
    public partial class AddRecurringWishReminderTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "LastRecurringReminderAtUtc",
                schema: "core",
                table: "wishes",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LastRecurringReminderAtUtc",
                schema: "core",
                table: "wishes");
        }
    }
}
