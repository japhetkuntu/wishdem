using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WishDem.Postgres.Sdk.Migrations
{
    /// <inheritdoc />
    public partial class AddWishDeliveryBackoff : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DeliveryAttemptCount",
                schema: "core",
                table: "wishes",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "NextDeliveryAttemptAtUtc",
                schema: "core",
                table: "wishes",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_wishes_NextDeliveryAttemptAtUtc",
                schema: "core",
                table: "wishes",
                column: "NextDeliveryAttemptAtUtc");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_wishes_NextDeliveryAttemptAtUtc",
                schema: "core",
                table: "wishes");

            migrationBuilder.DropColumn(
                name: "DeliveryAttemptCount",
                schema: "core",
                table: "wishes");

            migrationBuilder.DropColumn(
                name: "NextDeliveryAttemptAtUtc",
                schema: "core",
                table: "wishes");
        }
    }
}
