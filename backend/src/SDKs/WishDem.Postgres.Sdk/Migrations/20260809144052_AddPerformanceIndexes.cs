using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WishDem.Postgres.Sdk.Migrations
{
    /// <inheritdoc />
    public partial class AddPerformanceIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_wishes_DeliveredAtUtc",
                schema: "core",
                table: "wishes",
                column: "DeliveredAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_wishes_OpenedAtUtc",
                schema: "core",
                table: "wishes",
                column: "OpenedAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_wishes_SealedAtUtc",
                schema: "core",
                table: "wishes",
                column: "SealedAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_group_wish_memories_IsSealed",
                schema: "core",
                table: "group_wish_memories",
                column: "IsSealed");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_wishes_DeliveredAtUtc",
                schema: "core",
                table: "wishes");

            migrationBuilder.DropIndex(
                name: "IX_wishes_OpenedAtUtc",
                schema: "core",
                table: "wishes");

            migrationBuilder.DropIndex(
                name: "IX_wishes_SealedAtUtc",
                schema: "core",
                table: "wishes");

            migrationBuilder.DropIndex(
                name: "IX_group_wish_memories_IsSealed",
                schema: "core",
                table: "group_wish_memories");
        }
    }
}
