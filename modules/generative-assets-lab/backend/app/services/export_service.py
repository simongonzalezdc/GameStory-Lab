"""Export service for generating sprite sheets and texture atlases."""
import io
import json
import logging
import zipfile
from typing import List, Tuple
from PIL import Image
import xml.etree.ElementTree as ET

from app.models.export import ExportRequest, ExportFile

logger = logging.getLogger(__name__)


class ExportService:
    """Service for exporting assets in various formats."""

    @staticmethod
    async def create_sprite_sheet(
        assets: List[dict],
        request: ExportRequest
    ) -> Tuple[bytes, List[dict]]:
        """
        Create sprite sheet from multiple assets.

        Args:
            assets: List of asset dictionaries with image_bytes and metadata
            request: Export request with settings

        Returns:
            Tuple of (zip_bytes, file_info_list)
        """
        try:
            # Load all images
            images = []
            for asset in assets:
                img_bytes = asset["image_bytes"]
                img = Image.open(io.BytesIO(img_bytes))

                # Trim transparency if requested
                if request.settings.trim_transparency:
                    img = ExportService._trim_image(img)

                images.append({
                    "image": img,
                    "id": asset["id"],
                    "name": asset["file_name"]
                })

            # Pack images into sprite sheet
            sheet_img, sprite_data = ExportService._pack_sprites(
                images,
                request.settings.sheet_width,
                request.settings.sheet_height,
                request.settings.padding
            )

            # Scale if resolution multiplier > 1
            if request.resolution_multiplier > 1:
                new_width = sheet_img.width * request.resolution_multiplier
                new_height = sheet_img.height * request.resolution_multiplier
                sheet_img = sheet_img.resize(
                    (new_width, new_height),
                    Image.Resampling.NEAREST  # Pixel-perfect scaling
                )
                # Scale sprite coordinates
                for sprite in sprite_data:
                    for key in ["x", "y", "width", "height"]:
                        sprite[key] *= request.resolution_multiplier

            # Save sprite sheet
            sheet_bytes = io.BytesIO()
            sheet_img.save(sheet_bytes, format="PNG")
            sheet_bytes.seek(0)

            # Generate metadata file based on format
            metadata_bytes = None
            metadata_filename = None

            if request.format in ["sprite-sheet-json", "unity", "godot", "generic"]:
                metadata_bytes, metadata_filename = ExportService._generate_json_metadata(
                    sprite_data,
                    request.target_engine or "generic"
                )
            elif request.format == "texture-atlas-xml":
                metadata_bytes, metadata_filename = ExportService._generate_xml_metadata(sprite_data)

            # Create ZIP file
            zip_buffer = io.BytesIO()
            with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                # Add sprite sheet
                zip_file.writestr("sprite_sheet.png", sheet_bytes.getvalue())

                # Add metadata file if present
                if metadata_bytes and metadata_filename:
                    zip_file.writestr(metadata_filename, metadata_bytes)

            zip_buffer.seek(0)

            files_info = [
                {"name": "sprite_sheet.png", "size": len(sheet_bytes.getvalue())},
            ]
            if metadata_filename:
                files_info.append({"name": metadata_filename, "size": len(metadata_bytes)})

            return zip_buffer.getvalue(), files_info

        except Exception as e:
            logger.error(f"Failed to create sprite sheet: {e}")
            raise Exception(f"Sprite sheet creation failed: {str(e)}")

    @staticmethod
    def _pack_sprites(
        images: List[dict],
        sheet_width: int,
        sheet_height: int,
        padding: int
    ) -> Tuple[Image.Image, List[dict]]:
        """
        Pack sprites into sprite sheet using simple algorithm.

        Args:
            images: List of image dictionaries
            sheet_width: Target sheet width
            sheet_height: Target sheet height
            padding: Padding between sprites

        Returns:
            Tuple of (sheet_image, sprite_data_list)
        """
        # Create blank sheet
        sheet = Image.new('RGBA', (sheet_width, sheet_height), (0, 0, 0, 0))

        sprite_data = []
        current_x = padding
        current_y = padding
        row_height = 0

        for img_data in images:
            img = img_data["image"]

            # Check if sprite fits in current row
            if current_x + img.width + padding > sheet_width:
                # Move to next row
                current_x = padding
                current_y += row_height + padding
                row_height = 0

            # Check if sprite fits in sheet at all
            if current_y + img.height + padding > sheet_height:
                logger.warning(f"Sprite sheet too small for all assets. Some may be skipped.")
                break

            # Paste sprite
            sheet.paste(img, (current_x, current_y), img if img.mode == 'RGBA' else None)

            # Record sprite data
            sprite_data.append({
                "id": img_data["id"],
                "name": img_data["name"],
                "x": current_x,
                "y": current_y,
                "width": img.width,
                "height": img.height
            })

            # Update position
            current_x += img.width + padding
            row_height = max(row_height, img.height)

        return sheet, sprite_data

    @staticmethod
    def _trim_image(img: Image.Image) -> Image.Image:
        """Trim transparent pixels from image."""
        if img.mode != 'RGBA':
            img = img.convert('RGBA')

        bbox = img.getbbox()
        if bbox:
            return img.crop(bbox)
        return img

    @staticmethod
    def _generate_json_metadata(
        sprite_data: List[dict],
        target_engine: str
    ) -> Tuple[bytes, str]:
        """
        Generate JSON metadata for sprite sheet.

        Args:
            sprite_data: List of sprite information
            target_engine: Target game engine

        Returns:
            Tuple of (json_bytes, filename)
        """
        if target_engine == "unity":
            # Unity format
            metadata = {
                "frames": {
                    sprite["name"]: {
                        "frame": {
                            "x": sprite["x"],
                            "y": sprite["y"],
                            "w": sprite["width"],
                            "h": sprite["height"]
                        },
                        "spriteSourceSize": {
                            "x": 0,
                            "y": 0,
                            "w": sprite["width"],
                            "h": sprite["height"]
                        },
                        "sourceSize": {
                            "w": sprite["width"],
                            "h": sprite["height"]
                        }
                    }
                    for sprite in sprite_data
                },
                "meta": {
                    "format": "RGBA8888",
                    "size": {"w": 512, "h": 512},
                    "scale": "1"
                }
            }
        elif target_engine == "godot":
            # Godot AtlasTexture format
            metadata = {
                "frames": [
                    {
                        "name": sprite["name"],
                        "region": {
                            "x": sprite["x"],
                            "y": sprite["y"],
                            "width": sprite["width"],
                            "height": sprite["height"]
                        }
                    }
                    for sprite in sprite_data
                ]
            }
        else:
            # Generic format
            metadata = {
                "sprites": sprite_data,
                "meta": {
                    "version": "1.0",
                    "format": "RGBA8888",
                    "generator": "AI Game Asset Generator"
                }
            }

        json_bytes = json.dumps(metadata, indent=2).encode('utf-8')
        return json_bytes, "sprite_sheet.json"

    @staticmethod
    def _generate_xml_metadata(sprite_data: List[dict]) -> Tuple[bytes, str]:
        """
        Generate XML metadata (Cocos2d format).

        Args:
            sprite_data: List of sprite information

        Returns:
            Tuple of (xml_bytes, filename)
        """
        root = ET.Element("plist", version="1.0")
        dict_elem = ET.SubElement(root, "dict")

        # Add frames
        frames_key = ET.SubElement(dict_elem, "key")
        frames_key.text = "frames"
        frames_dict = ET.SubElement(dict_elem, "dict")

        for sprite in sprite_data:
            # Frame name
            name_key = ET.SubElement(frames_dict, "key")
            name_key.text = sprite["name"]

            # Frame data
            frame_dict = ET.SubElement(frames_dict, "dict")

            # Frame rect
            frame_key = ET.SubElement(frame_dict, "key")
            frame_key.text = "frame"
            frame_val = ET.SubElement(frame_dict, "string")
            frame_val.text = f"{{{{{sprite['x']},{sprite['y']}}},{{{sprite['width']},{sprite['height']}}}}}"

        tree = ET.ElementTree(root)
        xml_buffer = io.BytesIO()
        tree.write(xml_buffer, encoding='utf-8', xml_declaration=True)

        return xml_buffer.getvalue(), "sprite_sheet.plist"

    @staticmethod
    async def export_individual_pngs(assets: List[dict]) -> Tuple[bytes, List[dict]]:
        """
        Export assets as individual PNG files in a ZIP.

        Args:
            assets: List of asset dictionaries

        Returns:
            Tuple of (zip_bytes, file_info_list)
        """
        try:
            zip_buffer = io.BytesIO()
            files_info = []

            with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                for asset in assets:
                    file_name = asset["file_name"]
                    img_bytes = asset["image_bytes"]

                    zip_file.writestr(file_name, img_bytes)
                    files_info.append({"name": file_name, "size": len(img_bytes)})

            zip_buffer.seek(0)
            return zip_buffer.getvalue(), files_info

        except Exception as e:
            logger.error(f"Failed to export PNGs: {e}")
            raise Exception(f"PNG export failed: {str(e)}")
