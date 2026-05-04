package com.ulms.catalog.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path root;

    public FileStorageService(@Value("${file.upload-dir:uploads}") String uploadDir) {
        this.root = Paths.get(uploadDir);
        try {
            Files.createDirectories(root);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize storage", e);
        }
    }

    public String store(MultipartFile file) {
        try {
            if (file.isEmpty()) {
                throw new RuntimeException("Failed to store empty file.");
            }
            
            String extension = "";
            String fileName = file.getOriginalFilename();
            if (fileName != null && fileName.contains(".")) {
                extension = fileName.substring(fileName.lastIndexOf("."));
            }
            
            String storedFileName = UUID.randomUUID().toString() + extension;
            Path destinationFile = this.root.resolve(Paths.get(storedFileName))
                    .normalize().toAbsolutePath();

            if (!destinationFile.getParent().equals(this.root.toAbsolutePath())) {
                throw new RuntimeException("Cannot store file outside current directory.");
            }

            try (var inputStream = file.getInputStream()) {
                Files.copy(inputStream, destinationFile, StandardCopyOption.REPLACE_EXISTING);
            }

            // Generate thumbnail if it's a PDF
            if (".pdf".equalsIgnoreCase(extension)) {
                generateThumbnail(destinationFile, storedFileName.replace(".pdf", ".png"));
            }

            return storedFileName;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file.", e);
        }
    }

    private void generateThumbnail(Path pdfPath, String thumbnailName) {
        try (org.apache.pdfbox.pdmodel.PDDocument document = org.apache.pdfbox.Loader.loadPDF(pdfPath.toFile())) {
            
            org.apache.pdfbox.rendering.PDFRenderer renderer = new org.apache.pdfbox.rendering.PDFRenderer(document);
            java.awt.image.BufferedImage image = renderer.renderImageWithDPI(0, 72); // Render first page at 72 DPI
            
            Path thumbnailPath = this.root.resolve(thumbnailName);
            javax.imageio.ImageIO.write(image, "PNG", thumbnailPath.toFile());
        } catch (Exception e) {
            // Log but don't fail the whole upload
            System.err.println("Could not generate thumbnail for " + pdfPath + ": " + e.getMessage());
        }
    }
}
